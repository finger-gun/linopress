import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  createAgentRuntime,
  type AgentRuntimeOptions,
  type LlmProvider,
} from '../agent/runtime.js';
import { DEFAULT_TOOL_ALLOWLIST } from '../agent/tools.js';
import { loadPrompt } from '../build/prompts.js';
import type { BuildReport, BuildStep, ErrorLog, HealingCycle } from '../models/types.js';
import { assertStackExists, readStackEnv } from '../stack/compose.js';
import { createBrowserExecutor } from '../tools/browser-exec.js';
import { BROWSER_URL_ALLOWLIST } from '../tools/browser-tool.js';
import { createWpCliExecutor } from '../tools/wp-cli-exec.js';

export type SelfImproveInput = {
  siteId: string;
  baseUrl?: string;
  enableBrowser?: boolean;
  selfImproveTimeoutMs?: number;
  skillTimeoutMs?: number;
  modelProvider?: LlmProvider;
  model?: string;
  skillsDir?: string;
  reviewCycles?: number;
  maxReviewPages?: number;
  creativeness?: number;
  healCycles?: number;
};

type ValidationResult = BuildReport['validation'];

const DEFAULT_BASE_URL = (port?: number) => `http://localhost:${port ?? 8080}`;

export const normalizeCreativeness = (value?: number) => {
  if (value === undefined || Number.isNaN(value)) return 4;
  const rounded = Math.round(value);
  return Math.min(5, Math.max(1, rounded));
};

export const resolveReviewCycles = (creativeness: number, override?: number) => {
  if (override && override > 0) return Math.round(override);
  const base = 2;
  const extra = Math.max(0, creativeness - 3);
  return Math.min(base + extra, 4);
};

export const resolveControlFlowLoops = (creativeness: number) => Math.min(6 + creativeness, 10);

const createSteps = (): BuildStep[] => [
  { id: 'review', label: 'Self-improve review', status: 'pending' },
  { id: 'validate', label: 'Validate site', status: 'pending' },
  { id: 'heal', label: 'Self-heal (if needed)', status: 'pending' },
  { id: 'summary', label: 'Generate summary', status: 'pending' },
];

const updateStep = (steps: BuildStep[], id: string, update: Partial<BuildStep>) => {
  const step = steps.find((item) => item.id === id);
  if (step) Object.assign(step, update);
};

const markStep = (
  steps: BuildStep[],
  id: string,
  status: BuildStep['status'],
  details?: Record<string, unknown>,
) => {
  const now = new Date().toISOString();
  updateStep(steps, id, {
    status,
    ...(status === 'in_progress' ? { startedAt: now } : { finishedAt: now }),
    details,
  });
  console.log(`[selfimprove] ${id} -> ${status}`);
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const resolveBaseUrl = async (siteId: string, baseUrl?: string) => {
  if (baseUrl) return baseUrl;
  try {
    const env = await readStackEnv(siteId);
    const portValue = Number(env.WP_STACK_PORT ?? env.PORT ?? env.WORDPRESS_PORT);
    if (!Number.isNaN(portValue) && portValue > 0) {
      return DEFAULT_BASE_URL(portValue);
    }
  } catch {
    // ignore and fall back to default
  }
  return DEFAULT_BASE_URL();
};

const runWpCli = async (siteId: string, command: string, args?: string[]) => {
  const executor = createWpCliExecutor({ siteId });
  return executor({ command, args });
};

const getWordPressVersion = async (siteId: string) => {
  const result = await runWpCli(siteId, 'wp core version', ['--skip-plugins', '--skip-themes']);
  return result.stdout.trim();
};

const getActiveTheme = async (siteId: string) => {
  const result = await runWpCli(siteId, 'wp theme list', ['--status=active', '--format=json']);
  try {
    const parsed = JSON.parse(result.stdout.trim()) as Array<Record<string, string>>;
    const active = parsed[0];
    return active?.name || active?.title || active?.slug || 'unknown-theme';
  } catch {
    return 'unknown-theme';
  }
};

const getInstalledPlugins = async (siteId: string) => {
  const result = await runWpCli(siteId, 'wp plugin list', ['--format=json']);
  try {
    const parsed = JSON.parse(result.stdout.trim()) as Array<Record<string, string>>;
    return parsed.map((plugin) => `${plugin.name}@${plugin.version}`);
  } catch {
    return [];
  }
};

export const assertAllowlistedUrl = (url: string) => {
  const allowed = BROWSER_URL_ALLOWLIST.some((pattern) => pattern.test(url));
  if (!allowed) {
    throw new Error(`browser url not allowlisted: ${url}`);
  }
};

export const recordAllowlistViolation = (
  errors: ErrorLog[],
  stepId: string,
  url: string,
  error: string,
) => {
  errors.push({
    message: `Blocked external URL attempt: ${url}`,
    stepId,
    code: 'browser_url_blocked',
    timestamp: new Date().toISOString(),
    details: { error },
  });
};

const formatBytes = (value?: number) => {
  if (!value || Number.isNaN(value)) return 'unknown size';
  if (value < 1024) return `${value} B`;
  const kb = value / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
};

const listSitePages = async (siteId: string) => {
  const result = await runWpCli(siteId, 'wp post list', [
    '--post_type=page',
    '--post_status=publish',
    '--fields=ID,post_title,post_name',
    '--format=json',
  ]);
  try {
    const parsed = JSON.parse(result.stdout.trim()) as Array<{
      ID: string;
      post_title: string;
      post_name: string;
    }>;
    return parsed;
  } catch {
    return [] as Array<{ ID: string; post_title: string; post_name: string }>;
  }
};

const buildReviewPages = (
  baseUrl: string,
  pages: Array<{ post_name: string }> = [],
  maxPages = 3,
) => {
  const seen = new Set<string>();
  const items: Array<{ slug: string; url: string }> = [];

  const base = baseUrl.replace(/\/$/, '');
  items.push({ slug: 'home', url: baseUrl });
  seen.add(baseUrl);

  for (const page of pages) {
    const slug = page.post_name?.trim();
    if (!slug || slug === 'home' || slug === '/') continue;
    const url = `${base}/${slug}`;
    if (seen.has(url)) continue;
    items.push({ slug, url });
    seen.add(url);
    if (items.length >= maxPages) break;
  }

  return items.slice(0, maxPages);
};

const capturePageScreenshots = async (
  siteId: string,
  pages: Array<{ slug: string; url: string }>,
) => {
  const browser = createBrowserExecutor({ siteId });
  const sessionId = `selfimprove-${siteId}`;
  const screenshotPaths: Array<{ page: string; path: string }> = [];

  await browser({ operation: 'session_start', siteId, sessionId });
  try {
    for (const { slug, url } of pages) {
      assertAllowlistedUrl(url);
      try {
        await browser({
          operation: 'navigate',
          sessionId,
          url,
          waitUntil: 'networkidle',
        });
        const outputPath = `/tmp/${siteId}_selfimprove_${slug}_${Date.now()}.png`;
        const result = await browser({
          operation: 'screenshot',
          sessionId,
          url,
          fullPage: true,
          outputPath,
        });
        if ('path' in result && result.path) {
          screenshotPaths.push({ page: slug, path: result.path });
        }
      } catch (error) {
        console.log(
          `[selfimprove] Failed to screenshot ${slug}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  } finally {
    await browser({ operation: 'session_end', sessionId });
  }

  return screenshotPaths;
};

const getScreenshotMeta = async (screenshotPaths: Array<{ page: string; path: string }>) => {
  const results: Array<{ page: string; path: string; sizeBytes?: number }> = [];
  for (const { page, path: filePath } of screenshotPaths) {
    try {
      const stat = await fs.stat(filePath);
      results.push({ page, path: filePath, sizeBytes: stat.size });
    } catch (error) {
      console.log(
        `[selfimprove] Failed to stat screenshot ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
      );
      results.push({ page, path: filePath });
    }
  }
  return results;
};

const screenshotsToBase64 = async (
  screenshotPaths: Array<{ page: string; path: string }>,
  options?: { maxImages?: number; maxTotalChars?: number },
) => {
  const results: Array<{ page: string; dataUri: string }> = [];
  const skipped: Array<{ page: string; reason: string }> = [];
  const maxImages = options?.maxImages ?? screenshotPaths.length;
  const maxTotalChars = options?.maxTotalChars ?? Number.POSITIVE_INFINITY;
  let totalChars = 0;

  for (const { page, path: filePath } of screenshotPaths) {
    if (results.length >= maxImages) {
      skipped.push({ page, reason: `max images limit (${maxImages})` });
      continue;
    }
    try {
      const buffer = await fs.readFile(filePath);
      const base64 = buffer.toString('base64');
      const dataUri = `data:image/png;base64,${base64}`;
      const nextTotal = totalChars + dataUri.length;
      if (results.length > 0 && nextTotal > maxTotalChars) {
        skipped.push({ page, reason: 'image payload too large for context' });
        continue;
      }
      results.push({ page, dataUri });
      totalChars = nextTotal;
    } catch (error) {
      console.log(
        `[selfimprove] Failed to read screenshot ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return { screenshots: results, skipped };
};

const parseJsonFromText = (text: string) => {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return undefined;
  try {
    return JSON.parse(match[0]);
  } catch {
    return undefined;
  }
};

const getAssistantText = (ctx: any) => {
  const messages = Array.isArray(ctx?.messages) ? ctx.messages : [];
  const last = [...messages].reverse().find((msg) => msg?.role === 'assistant');
  const content = last?.content;
  if (typeof content === 'string') return content.trim();
  if (Array.isArray(content)) {
    const text = content.find((entry) => entry?.type === 'text')?.text;
    return typeof text === 'string' ? text.trim() : '';
  }
  return '';
};

const summarizeContentState = async (siteId: string) => {
  const issues: string[] = [];
  const details: Record<string, unknown> = {};

  const pageListResult = await runWpCli(siteId, 'wp post list', [
    '--post_type=page',
    '--post_status=any',
    '--fields=ID,post_title,post_name,post_status,post_content',
    '--format=json',
  ]);

  let existingPages: Array<{
    ID: string;
    post_title: string;
    post_name: string;
    post_status: string;
    post_content: string;
  }> = [];
  try {
    existingPages = JSON.parse(pageListResult.stdout.trim());
  } catch {
    issues.push('Could not retrieve page list from WordPress');
  }

  details.existingPages = existingPages.map((p) => ({
    id: p.ID,
    title: p.post_title,
    slug: p.post_name,
    status: p.post_status,
    contentLength: (p.post_content ?? '').length,
  }));

  const defaultPages = existingPages.filter(
    (p) => p.post_name === 'sample-page' || p.post_title === 'Sample Page',
  );
  if (defaultPages.length > 0) {
    issues.push('Default "Sample Page" still exists');
  }

  const postListResult = await runWpCli(siteId, 'wp post list', [
    '--post_type=post',
    '--fields=ID,post_title,post_name',
    '--format=json',
  ]);
  try {
    const posts = JSON.parse(postListResult.stdout.trim());
    const helloWorld = posts.find((p: { post_title: string }) => p.post_title === 'Hello world!');
    if (helloWorld) {
      issues.push('Default "Hello world!" post still exists');
    }
  } catch {
    // ignore
  }

  const showOnFrontResult = await runWpCli(siteId, 'wp option get', ['show_on_front']);
  const showOnFront = showOnFrontResult.stdout.trim();
  details.showOnFront = showOnFront;
  if (showOnFront !== 'page') {
    issues.push('Front page not set to a static page');
  } else {
    const pageOnFrontResult = await runWpCli(siteId, 'wp option get', ['page_on_front']);
    const pageOnFront = pageOnFrontResult.stdout.trim();
    details.pageOnFront = pageOnFront;
    if (!pageOnFront || pageOnFront === '0') {
      issues.push('Front page is set to page mode but no page is assigned');
    }
  }

  const menuListResult = await runWpCli(siteId, 'wp menu list', ['--format=json']);
  let menus: Array<{ term_id: string; name: string; count: string }> = [];
  try {
    menus = JSON.parse(menuListResult.stdout.trim());
  } catch {
    // ignore
  }
  details.menus = menus;
  if (menus.length === 0) {
    issues.push('No navigation menus exist');
  } else {
    const primaryMenu = menus[0];
    const itemCount = parseInt(primaryMenu.count ?? '0', 10);
    if (itemCount === 0) {
      issues.push(`Navigation menu "${primaryMenu.name}" has 0 items`);
    }
  }

  const contentState = [
    issues.length
      ? `Pre-flight check detected issues:\n${issues.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}`
      : 'Pre-flight check: no blocking issues detected.',
    `Page count: ${existingPages.length}`,
    `Menu count: ${menus.length}`,
    `show_on_front: ${showOnFront || 'unknown'}`,
  ].join('\n');

  return { contentState, issues, details };
};

const runCliValidation = async (siteId: string) => {
  let databaseOk = false;
  let healthCheckOk = false;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const results = await Promise.allSettled([
      runWpCli(siteId, 'wp db check', ['--skip-plugins', '--skip-themes']),
      runWpCli(siteId, 'wp doctor check', ['--skip-plugins', '--skip-themes']),
    ]);

    databaseOk = results[0].status === 'fulfilled' && results[0].value.exitCode === 0;
    if (results[1].status === 'fulfilled') {
      healthCheckOk = results[1].value.exitCode === 0;
      if (!healthCheckOk) {
        const stderr = results[1].value.stderr.toLowerCase();
        if (stderr.includes('not a registered wp command')) {
          healthCheckOk = true;
        }
      }
    } else {
      healthCheckOk = false;
    }

    if (databaseOk && healthCheckOk) break;
    if (attempt < 3) await sleep(2000);
  }

  return { databaseOk, filesystemOk: databaseOk, healthCheckOk };
};

const runBrowserValidation = async (siteId: string, urls: string[]) => {
  const browser = createBrowserExecutor({ siteId });
  const sessionId = `validate-${siteId}`;
  const pagesLoaded: string[] = [];
  const consoleErrors: Array<{ message: string; type?: string; line?: number }> = [];
  const screenshots: string[] = [];

  await browser({ operation: 'session_start', siteId, sessionId });
  try {
    for (const url of urls) {
      assertAllowlistedUrl(url);
      try {
        const result = await browser({
          operation: 'navigate',
          sessionId,
          url,
          waitUntil: 'domcontentloaded',
          includeConsole: true,
          includeNetwork: true,
          captureOnError: true,
        });
        if ('url' in result) {
          pagesLoaded.push(result.url);
          if (result.consoleErrors?.length) {
            consoleErrors.push(
              ...result.consoleErrors.map((err) => ({
                message: err.message,
                type: err.source,
                line: err.line,
              })),
            );
          }
          if (result.errorScreenshotPath) {
            screenshots.push(result.errorScreenshotPath);
          }
        }
      } catch (error) {
        consoleErrors.push({ message: error instanceof Error ? error.message : String(error) });
      }
    }
  } finally {
    await browser({ operation: 'session_end', sessionId });
  }

  return { pagesLoaded, consoleErrors, screenshotsCaptured: screenshots.length, screenshots };
};

const selfImproveValidation = async (siteId: string, baseUrl: string, enableBrowser?: boolean) => {
  const cli = await runCliValidation(siteId);
  if (!enableBrowser) {
    return {
      validation: { cli, browser: { pagesLoaded: [], consoleErrors: [], screenshotsCaptured: 0 } },
      screenshots: [] as string[],
    };
  }

  const browser = await runBrowserValidation(siteId, [baseUrl]);
  return {
    validation: {
      cli,
      browser: {
        pagesLoaded: browser.pagesLoaded,
        consoleErrors: browser.consoleErrors,
        screenshotsCaptured: browser.screenshotsCaptured,
      },
    },
    screenshots: browser.screenshots,
  };
};

const runSelfImproveReview = async (params: {
  runtimeOptions: AgentRuntimeOptions;
  siteId: string;
  baseUrl: string;
  steps: BuildStep[];
  errors: ErrorLog[];
  maxCycles: number;
  maxPages: number;
  creativeness: number;
}) => {
  const { runtimeOptions, siteId, baseUrl, steps, errors, maxCycles, maxPages, creativeness } =
    params;
  markStep(steps, 'review', 'in_progress');

  const reviewDetails: Array<Record<string, unknown>> = [];
  const improvements: Array<{ issue?: string; fix?: string }> = [];
  const failures: string[] = [];

  const pages = await listSitePages(siteId);
  const reviewPages = buildReviewPages(baseUrl, pages, maxPages);

  const { contentState, issues: preflightIssues } = await summarizeContentState(siteId);

  for (let cycle = 1; cycle <= maxCycles; cycle += 1) {
    console.log(`[selfimprove] Cycle ${cycle}/${maxCycles}: capturing screenshots...`);
    const screenshotPaths = await capturePageScreenshots(siteId, reviewPages);
    if (screenshotPaths.length === 0) {
      console.log('[selfimprove] No screenshots captured, skipping visual review');
      break;
    }

    const screenshotMeta = await getScreenshotMeta(screenshotPaths);
    const maxReviewImages = Math.min(3, screenshotMeta.length);
    if (screenshotMeta.length > maxReviewImages) {
      console.log(
        `[selfimprove] Limiting review to ${maxReviewImages}/${screenshotMeta.length} screenshots to control context size`,
      );
    }
    const selectedScreenshots = screenshotMeta.slice(0, maxReviewImages);
    console.log('[selfimprove] Using screenshots:');
    for (const shot of selectedScreenshots) {
      const label = path.basename(shot.path);
      console.log(`[selfimprove]   - ${shot.page}: ${formatBytes(shot.sizeBytes)} (${label})`);
    }

    const { screenshots, skipped } = await screenshotsToBase64(selectedScreenshots, {
      maxImages: maxReviewImages,
      maxTotalChars: 1_200_000,
    });
    if (skipped.length > 0) {
      for (const skip of skipped) {
        console.log(`[selfimprove] Skipping ${skip.page} screenshot: ${skip.reason}`);
      }
    }
    if (screenshots.length === 0) {
      console.log('[selfimprove] Failed to encode screenshots, skipping visual review');
      break;
    }

    const reviewInstruction = await loadPrompt('selfimprove-review', {
      pageList: screenshots.map((s) => s.page).join(', '),
      cycle: String(cycle),
      maxCycles: String(maxCycles),
      creativeness: String(creativeness),
      contentState,
    });

    const runtime = createAgentRuntime(runtimeOptions);
    const imageContentParts: unknown[] = [
      { type: 'text', text: reviewInstruction },
      ...screenshots.map((s) => ({
        type: 'image_url',
        image_url: { url: s.dataUri, detail: 'high' },
      })),
    ];

    try {
      console.log(
        `[selfimprove] Cycle ${cycle}: sending ${screenshots.length} screenshots to LLM for review...`,
      );
      const ctx = runtime.createContext(reviewInstruction);
      const userMsg = (ctx as any).messages?.find?.((m: any) => m.role === 'user');
      if (userMsg) {
        (userMsg as any).content = imageContentParts;
      }
      await runtime.agent.handler()(ctx);

      const responseText = getAssistantText(ctx);
      const parsed = parseJsonFromText(responseText) ?? {};

      const issuesFound = typeof parsed.issuesFound === 'number' ? parsed.issuesFound : 0;
      const issuesFixed = typeof parsed.issuesFixed === 'number' ? parsed.issuesFixed : 0;
      const remainingIssues = Array.isArray(parsed.remainingIssues)
        ? parsed.remainingIssues.filter((issue: unknown) => typeof issue === 'string')
        : [];
      const observations = Array.isArray(parsed.observations)
        ? parsed.observations.filter((entry: unknown) => entry && typeof entry === 'object')
        : [];
      const actions = Array.isArray(parsed.actions)
        ? parsed.actions.filter((entry: unknown) => entry && typeof entry === 'object')
        : [];
      const findings =
        parsed.findings && typeof parsed.findings === 'object' ? parsed.findings : {};

      for (const action of actions as Array<Record<string, unknown>>) {
        const issue = typeof action.issue === 'string' ? action.issue : undefined;
        const fix = typeof action.fix === 'string' ? action.fix : undefined;
        if (issue || fix) improvements.push({ issue, fix });
      }
      if (remainingIssues.length > 0) {
        failures.push(...remainingIssues);
      }

      reviewDetails.push({
        cycle,
        issuesFound,
        issuesFixed,
        remainingIssues,
        observations,
        actions,
        findings,
        preflightIssues,
      });

      console.log(
        `[selfimprove] Cycle ${cycle}: found ${issuesFound} issues, fixed ${issuesFixed}`,
      );
      if (issuesFound === 0) {
        console.log('[selfimprove] Site looks good, no issues found');
        break;
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`[selfimprove] Cycle ${cycle} failed: ${msg}`);
      errors.push({
        message: `Review cycle ${cycle}: ${msg}`,
        timestamp: new Date().toISOString(),
        code: 'review_cycle_error',
      });
      if (msg.includes('not allowlisted')) {
        recordAllowlistViolation(errors, 'review', 'external', msg);
      }
      break;
    }
  }

  markStep(steps, 'review', 'success', {
    cycles: reviewDetails,
    totalIssuesFound: reviewDetails.reduce(
      (sum, detail) => sum + (typeof detail.issuesFound === 'number' ? detail.issuesFound : 0),
      0,
    ),
    totalIssuesFixed: reviewDetails.reduce(
      (sum, detail) => sum + (typeof detail.issuesFixed === 'number' ? detail.issuesFixed : 0),
      0,
    ),
    improvements,
    failures,
  });
};

const generateSelfImproveSummary = async (
  runtimeOptions: AgentRuntimeOptions,
  report: BuildReport,
) => {
  try {
    const runtime = createAgentRuntime(runtimeOptions);
    const reviewStep = report.steps.find((step) => step.id === 'review');
    const improvements = reviewStep?.details?.improvements
      ? JSON.stringify(reviewStep.details.improvements)
      : '[]';
    const failures = reviewStep?.details?.failures
      ? JSON.stringify(reviewStep.details.failures)
      : '[]';

    const instruction = await loadPrompt('selfimprove-summary', {
      improvements,
      failures,
      validation: JSON.stringify(report.validation),
      steps: JSON.stringify(report.steps.map((step) => ({ id: step.id, status: step.status }))),
    });

    const ctx = await runtime.run(instruction);
    const text = getAssistantText(ctx);
    return text || undefined;
  } catch (error) {
    console.log(
      `[selfimprove] Failed to generate summary: ${error instanceof Error ? error.message : String(error)}`,
    );
    return undefined;
  }
};

const buildReport = async (params: {
  siteId: string;
  status: BuildReport['status'];
  steps: BuildStep[];
  validation: ValidationResult;
  screenshots: string[];
  errors: ErrorLog[];
  startedAt: string;
  endedAt: string;
}) => {
  const duration = new Date(params.endedAt).getTime() - new Date(params.startedAt).getTime();
  let wpVersion = 'unknown';
  let themeGenerated = 'unknown';
  let pluginsInstalled: string[] = [];

  try {
    wpVersion = await getWordPressVersion(params.siteId);
    themeGenerated = await getActiveTheme(params.siteId);
    pluginsInstalled = await getInstalledPlugins(params.siteId);
  } catch {
    // ignore metadata fetch errors
  }

  const report: BuildReport = {
    siteId: params.siteId,
    status: params.status,
    mode: 'selfimprove',
    steps: params.steps,
    validation: params.validation,
    screenshots: params.screenshots,
    errors: params.errors.length ? params.errors : undefined,
    metadata: {
      startTime: params.startedAt,
      endTime: params.endedAt,
      duration: duration < 0 ? 0 : duration,
      wpVersion,
      themeGenerated,
      pluginsInstalled,
    },
  };

  return report;
};

const runWithTimeout = async <T>(promise: Promise<T>, timeoutMs?: number) => {
  if (!timeoutMs) return promise;
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Selfimprove timed out')), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

export const runSelfImprove = async (input: SelfImproveInput): Promise<BuildReport> => {
  const startedAt = new Date().toISOString();
  const errors: ErrorLog[] = [];
  const steps = createSteps();

  await assertStackExists(input.siteId);
  const baseUrl = await resolveBaseUrl(input.siteId, input.baseUrl);

  const creativeness = normalizeCreativeness(input.creativeness);
  const maxCycles = resolveReviewCycles(creativeness, input.reviewCycles);
  const maxPages = input.maxReviewPages ?? 3;

  const runtimeOptions: AgentRuntimeOptions = {
    siteId: input.siteId,
    modelProvider: input.modelProvider,
    model: input.model,
    skillsDir: input.skillsDir,
    skillTimeoutMs: input.skillTimeoutMs,
    toolAllowlist: [...DEFAULT_TOOL_ALLOWLIST],
    useControlFlow: true,
    controlFlowMaxLoops: resolveControlFlowLoops(creativeness),
  };

  try {
    await runSelfImproveReview({
      runtimeOptions,
      siteId: input.siteId,
      baseUrl,
      steps,
      errors,
      maxCycles,
      maxPages,
      creativeness,
    });

    markStep(steps, 'validate', 'in_progress');
    let { validation, screenshots } = await selfImproveValidation(
      input.siteId,
      baseUrl,
      input.enableBrowser ?? true,
    );
    markStep(steps, 'validate', 'success');

    const healingCycles: HealingCycle[] = [];
    const validationOk =
      validation.cli.databaseOk &&
      validation.cli.filesystemOk &&
      validation.cli.healthCheckOk &&
      validation.browser.consoleErrors.length === 0;

    if (!validationOk) {
      markStep(steps, 'heal', 'in_progress');
      const maxHealCycles = input.healCycles ?? 2;
      const runtime = createAgentRuntime(runtimeOptions);
      for (let cycle = 1; cycle <= maxHealCycles; cycle += 1) {
        const cycleStartedAt = new Date().toISOString();
        await runtime.run(
          await loadPrompt('heal', {
            cycle: String(cycle),
            siteSpec: '{}',
          }),
        );
        const healingResult = await selfImproveValidation(
          input.siteId,
          baseUrl,
          input.enableBrowser ?? true,
        );
        validation = healingResult.validation;
        screenshots = healingResult.screenshots;
        const okNow =
          validation.cli.databaseOk &&
          validation.cli.filesystemOk &&
          validation.cli.healthCheckOk &&
          validation.browser.consoleErrors.length === 0;

        healingCycles.push({
          cycle,
          startedAt: cycleStartedAt,
          finishedAt: new Date().toISOString(),
          actions: [{ action: 'self-heal', detail: okNow ? 'resolved' : 'retry' }],
          result: okNow ? 'success' : cycle === maxHealCycles ? 'failed' : 'partial',
        });

        if (okNow) break;
      }
      markStep(steps, 'heal', 'success');
    } else {
      markStep(steps, 'heal', 'success', { skipped: true });
    }

    const finalOk =
      validation.cli.databaseOk &&
      validation.cli.filesystemOk &&
      validation.cli.healthCheckOk &&
      validation.browser.consoleErrors.length === 0;

    const status: BuildReport['status'] = finalOk ? 'success' : 'failed';
    const endedAt = new Date().toISOString();
    const report = await buildReport({
      siteId: input.siteId,
      status,
      steps,
      validation,
      screenshots,
      errors,
      startedAt,
      endedAt,
    });

    if (!finalOk && healingCycles.length > 0) {
      report.healingCycles = healingCycles;
    }

    markStep(steps, 'summary', 'in_progress');
    const summary = await generateSelfImproveSummary(runtimeOptions, report);
    if (summary) {
      report.summary = summary;
      markStep(steps, 'summary', 'success');
    } else {
      markStep(steps, 'summary', 'success', {
        skipped: true,
        reason: 'summary generation failed',
      });
    }

    return report;
  } catch (error) {
    const endedAt = new Date().toISOString();
    errors.push({
      message: error instanceof Error ? error.message : String(error),
      timestamp: endedAt,
    });
    const report = await buildReport({
      siteId: input.siteId,
      status: 'failed',
      steps,
      validation: {
        cli: { databaseOk: false, filesystemOk: false, healthCheckOk: false },
        browser: { pagesLoaded: [], consoleErrors: [], screenshotsCaptured: 0 },
      },
      screenshots: [],
      errors,
      startedAt,
      endedAt,
    });
    return report;
  }
};

export const selfImproveFromInput = async (input: SelfImproveInput) =>
  runWithTimeout(runSelfImprove(input), input.selfImproveTimeoutMs);
