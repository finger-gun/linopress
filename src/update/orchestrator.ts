import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  createAgentRuntime,
  type AgentRuntimeOptions,
  type LlmProvider,
} from '../agent/runtime.js';
import type { ToolName } from '../agent/tools.js';
import { loadPrompt } from '../build/prompts.js';
import { validateUpdateRequest } from '../models/schemas.js';
import type { BuildReport, BuildStep, ErrorLog, HealingCycle } from '../models/types.js';
import { assertStackExists, readStackEnv } from '../stack/compose.js';
import { createBrowserExecutor } from '../tools/browser-exec.js';
import { createExportExecutor } from '../tools/export-exec.js';
import { createFileTool } from '../tools/file-tool.js';
import { createWpCliExecutor } from '../tools/wp-cli-exec.js';

export type UpdateOrchestratorInput = {
  siteId: string;
  prompt: string;
  baseSpecPath?: string;
  allowlistProfile?: 'default' | 'strict';
  baseUrl?: string;
  enableBrowser?: boolean;
  enableHealing?: boolean;
  enableReview?: boolean;
  updateTimeoutMs?: number;
  skillTimeoutMs?: number;
  modelProvider?: LlmProvider;
  model?: string;
  skillsDir?: string;
  reviewCycles?: number;
  maxReviewPages?: number;
};

type ValidationResult = BuildReport['validation'];

const UPDATE_TOOL_ALLOWLIST: ToolName[] = ['wp_cli', 'file', 'browser', 'export'];
const DEFAULT_BASE_URL = (port?: number) => `http://localhost:${port ?? 8080}`;

const createSteps = (): BuildStep[] => [
  { id: 'analyze', label: 'Analyze current site', status: 'pending' },
  { id: 'plan', label: 'Plan update changes', status: 'pending' },
  { id: 'apply', label: 'Apply update changes', status: 'pending' },
  { id: 'review', label: 'Visual review', status: 'pending' },
  { id: 'validate', label: 'Validate site', status: 'pending' },
  { id: 'heal', label: 'Self-heal (if needed)', status: 'pending' },
  { id: 'export', label: 'Export bundle', status: 'pending' },
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
  console.log(`[update] ${id} -> ${status}`);
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

const getActiveThemeSlug = async (siteId: string) => {
  const result = await runWpCli(siteId, 'wp theme list', ['--status=active', '--format=json']);
  try {
    const parsed = JSON.parse(result.stdout.trim()) as Array<Record<string, string>>;
    const active = parsed.find((entry) => entry.status === 'active') ?? parsed[0];
    return (
      active?.stylesheet || active?.slug || active?.name || active?.textdomain || 'unknown-theme'
    );
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

const formatBytes = (value?: number) => {
  if (!value || Number.isNaN(value)) return 'unknown size';
  if (value < 1024) return `${value} B`;
  const kb = value / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
};

const capturePageScreenshots = async (siteId: string, baseUrl: string) => {
  const browser = createBrowserExecutor({ siteId });
  const sessionId = `review-${siteId}`;
  const screenshotPaths: Array<{ page: string; path: string }> = [];

  await browser({ operation: 'session_start', siteId, sessionId });
  try {
    const url = baseUrl;
    await browser({
      operation: 'navigate',
      sessionId,
      url,
      waitUntil: 'networkidle',
    });
    const outputPath = `/tmp/${siteId}_review_home_${Date.now()}.png`;
    const result = await browser({
      operation: 'screenshot',
      sessionId,
      url,
      fullPage: true,
      outputPath,
    });
    if ('path' in result && result.path) {
      screenshotPaths.push({ page: 'home', path: result.path });
    }
  } catch (error) {
    console.log(
      `[review] Failed to capture screenshot: ${error instanceof Error ? error.message : String(error)}`,
    );
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
        `[review] Failed to stat screenshot ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
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
        `[review] Failed to read screenshot ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  return { screenshots: results, skipped };
};

const runVisualReview = async (
  runtimeOptions: AgentRuntimeOptions,
  siteId: string,
  baseUrl: string,
  originalPrompt: string,
  steps: BuildStep[],
  errors: ErrorLog[],
  maxCycles = 2,
) => {
  markStep(steps, 'review', 'in_progress');
  const reviewDetails: Array<{ cycle: number; issuesFound: number; issuesFixed: number }> = [];

  for (let cycle = 1; cycle <= maxCycles; cycle += 1) {
    console.log(`[review] Cycle ${cycle}/${maxCycles}: capturing screenshots...`);

    const screenshotPaths = await capturePageScreenshots(siteId, baseUrl);
    if (screenshotPaths.length === 0) {
      console.log('[review] No screenshots captured, skipping visual review');
      break;
    }

    const screenshotMeta = await getScreenshotMeta(screenshotPaths);
    const maxReviewImages = Math.min(1, screenshotMeta.length);
    const selectedScreenshots = screenshotMeta.slice(0, maxReviewImages);
    console.log('[review] Using screenshots:');
    for (const shot of selectedScreenshots) {
      const label = path.basename(shot.path);
      console.log(`[review]   - ${shot.page}: ${formatBytes(shot.sizeBytes)} (${label})`);
    }

    const { screenshots, skipped } = await screenshotsToBase64(selectedScreenshots, {
      maxImages: maxReviewImages,
      maxTotalChars: 1_200_000,
    });
    if (skipped.length > 0) {
      for (const skip of skipped) {
        console.log(`[review] Skipping ${skip.page} screenshot: ${skip.reason}`);
      }
    }
    if (screenshots.length === 0) {
      console.log('[review] Failed to encode screenshots, skipping visual review');
      break;
    }

    const reviewInstruction = await loadPrompt('review', {
      pageList: screenshots.map((s) => s.page).join(', '),
      cycle: String(cycle),
      maxCycles: String(maxCycles),
      originalPrompt,
      siteSpec: JSON.stringify({}),
      contentState: '',
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
        `[review] Cycle ${cycle}: sending ${screenshots.length} screenshots to LLM for visual review...`,
      );
      const ctx = runtime.createContext(reviewInstruction);
      const userMsg = (ctx as any).messages?.find?.((m: any) => m.role === 'user');
      if (userMsg) {
        (userMsg as any).content = imageContentParts;
      }
      await runtime.agent.handler()(ctx);

      const responseText = getAssistantText(ctx);
      let issuesFound = 0;
      let issuesFixed = 0;
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*"issuesFound"[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          issuesFound = parsed.issuesFound ?? 0;
          issuesFixed = parsed.issuesFixed ?? 0;
        }
      } catch {
        // ignore parse errors
      }

      reviewDetails.push({ cycle, issuesFound, issuesFixed });
      console.log(`[review] Cycle ${cycle}: found ${issuesFound} issues, fixed ${issuesFixed}`);
      if (issuesFound === 0) {
        console.log('[review] Site looks good, no issues found');
        break;
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`[review] Cycle ${cycle} failed: ${msg}`);
      errors.push({
        message: `Review cycle ${cycle}: ${msg}`,
        timestamp: new Date().toISOString(),
        code: 'review_cycle_error',
      });
      break;
    }
  }

  markStep(steps, 'review', 'success', {
    cycles: reviewDetails,
    totalIssuesFound: reviewDetails.reduce((sum, d) => sum + d.issuesFound, 0),
    totalIssuesFixed: reviewDetails.reduce((sum, d) => sum + d.issuesFixed, 0),
  });
};

const updateValidation = async (siteId: string, baseUrl: string, enableBrowser?: boolean) => {
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

const resolveHomepageId = async (siteId: string) => {
  const showOnFront = (await runWpCli(siteId, 'wp option get', ['show_on_front'])).stdout.trim();
  if (showOnFront === 'page') {
    const pageOnFront = (await runWpCli(siteId, 'wp option get', ['page_on_front'])).stdout.trim();
    if (pageOnFront && pageOnFront !== '0') return pageOnFront;
  }

  const pagesResult = await runWpCli(siteId, 'wp post list', [
    '--post_type=page',
    '--fields=ID,post_title,post_name',
    '--format=json',
  ]);
  try {
    const pages = JSON.parse(pagesResult.stdout.trim()) as Array<{
      ID: string;
      post_title: string;
      post_name: string;
    }>;
    const home =
      pages.find((p) => p.post_name === 'home') ??
      pages.find((p) => p.post_title.toLowerCase() === 'home');
    return home?.ID;
  } catch {
    return undefined;
  }
};

const extractTemplatePartSlugs = (content: string) => {
  const slugs = new Set<string>();
  const regex = /"slug"\s*:\s*"([^"]+)"/g;
  let match: RegExpExecArray | null = null;
  while ((match = regex.exec(content)) !== null) {
    if (match[1]) slugs.add(match[1]);
  }
  return [...slugs];
};

const createThemeReader = (siteId: string) => {
  const fileTool = createFileTool();
  const readIfExists = async (path: string): Promise<string | undefined> => {
    const existsResult = (await fileTool.handler(
      { operation: 'exists', path, siteId },
      {} as never,
    )) as { status: 'ok'; exists?: boolean };
    if (existsResult.status === 'ok' && existsResult.exists) {
      const readResult = (await fileTool.handler(
        { operation: 'read', path, siteId },
        {} as never,
      )) as { status: 'ok'; data?: unknown };
      if (readResult.status === 'ok' && typeof readResult.data === 'string') {
        return readResult.data;
      }
    }
    return undefined;
  };
  return { readIfExists };
};

type UpdateSnapshot = {
  content: Record<string, string>;
  files: Record<string, string>;
};

const extractReusableBlockIds = (content: string) => {
  const ids = new Set<string>();
  const regex = /"ref"\s*:\s*(\d+)/g;
  let match: RegExpExecArray | null = null;
  while ((match = regex.exec(content)) !== null) {
    if (match[1]) ids.add(match[1]);
  }
  return [...ids];
};

const captureUpdateSnapshot = async (siteId: string): Promise<UpdateSnapshot> => {
  const homeId = await resolveHomepageId(siteId);
  const content: Record<string, string> = {};
  if (homeId) {
    content[`post:${homeId}`] = (
      await runWpCli(siteId, 'wp post get', [homeId, '--field=post_content'])
    ).stdout;
  }

  const themeSlug = await getActiveThemeSlug(siteId);
  const themeRoot = `/var/www/html/wp-content/themes/${themeSlug}`;
  const reader = createThemeReader(siteId);

  const files: Record<string, string> = {};

  const themeJson = await reader.readIfExists(`${themeRoot}/theme.json`);
  if (themeJson !== undefined) {
    files[`${themeRoot}/theme.json`] = themeJson;
  }
  const templatePaths = [
    `${themeRoot}/templates/front-page.html`,
    `${themeRoot}/templates/home.html`,
    `${themeRoot}/templates/index.html`,
  ];

  for (const filePath of templatePaths) {
    const content = await reader.readIfExists(filePath);
    if (content !== undefined) {
      files[filePath] = content;
      const slugs = extractTemplatePartSlugs(content);
      for (const slug of slugs) {
        const partPath = `${themeRoot}/parts/${slug}.html`;
        if (!(partPath in files)) {
          const partContent = await reader.readIfExists(partPath);
          if (partContent !== undefined) {
            files[partPath] = partContent;
          }
        }
      }
    }
  }

  const reusableIds = new Set<string>();
  for (const value of Object.values(content)) {
    for (const id of extractReusableBlockIds(value)) {
      reusableIds.add(id);
    }
  }
  for (const [path, value] of Object.entries(files)) {
    if (path.endsWith('.html')) {
      for (const id of extractReusableBlockIds(value)) {
        reusableIds.add(id);
      }
    }
  }
  for (const id of reusableIds) {
    content[`wp_block:${id}`] = (
      await runWpCli(siteId, 'wp post get', [id, '--field=post_content'])
    ).stdout;
  }

  return { content, files };
};

const diffSnapshots = (before: UpdateSnapshot, after: UpdateSnapshot) => {
  const changes: string[] = [];
  const allContentKeys = new Set([...Object.keys(before.content), ...Object.keys(after.content)]);
  const allFileKeys = new Set([...Object.keys(before.files), ...Object.keys(after.files)]);

  for (const key of allContentKeys) {
    if (before.content[key] !== after.content[key]) {
      changes.push(`Content updated: ${key}`);
    }
  }
  for (const key of allFileKeys) {
    if (before.files[key] !== after.files[key]) {
      changes.push(`File updated: ${key}`);
    }
  }
  return changes;
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
  exportBundle?: string;
  update: BuildReport['update'];
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
    mode: 'update',
    steps: params.steps,
    validation: params.validation,
    screenshots: params.screenshots,
    exportBundle: params.exportBundle,
    errors: params.errors.length ? params.errors : undefined,
    update: params.update,
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

const generateUpdateSummary = async (
  runtimeOptions: AgentRuntimeOptions,
  prompt: string,
  report: BuildReport,
  changeSummary: string[],
): Promise<string | undefined> => {
  try {
    const runtime = createAgentRuntime(runtimeOptions);
    const instruction = await loadPrompt('update-summary', {
      prompt,
      siteId: report.siteId,
      changeSummary: changeSummary.length ? JSON.stringify(changeSummary) : '[]',
      steps: JSON.stringify(report.steps.map((s) => ({ id: s.id, status: s.status }))),
      validation: JSON.stringify(report.validation),
      errors: report.errors?.length ? JSON.stringify(report.errors) : 'none',
    });
    const ctx = await runtime.run(instruction);
    const text = getAssistantText(ctx);
    return text || undefined;
  } catch (error) {
    console.log(
      `[summary] Failed to generate update summary: ${error instanceof Error ? error.message : String(error)}`,
    );
    return undefined;
  }
};

const runWithTimeout = async <T>(promise: Promise<T>, timeoutMs?: number) => {
  if (!timeoutMs) return promise;
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Update timed out')), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

export const runUpdate = async (input: UpdateOrchestratorInput): Promise<BuildReport> => {
  const updateRequest = validateUpdateRequest({
    siteId: input.siteId,
    prompt: input.prompt,
    baseSpecPath: input.baseSpecPath,
    allowlistProfile: input.allowlistProfile,
  });

  const startedAt = new Date().toISOString();
  const errors: ErrorLog[] = [];
  const steps = createSteps();

  await assertStackExists(updateRequest.siteId);
  const baseUrl = await resolveBaseUrl(updateRequest.siteId, input.baseUrl);

  const runtimeOptions: AgentRuntimeOptions = {
    siteId: updateRequest.siteId,
    modelProvider: input.modelProvider,
    model: input.model,
    skillsDir: input.skillsDir,
    skillTimeoutMs: input.skillTimeoutMs,
    toolAllowlist: [...UPDATE_TOOL_ALLOWLIST],
  };

  const runtime = createAgentRuntime(runtimeOptions);
  let updateOk = true;
  let changeSummary: string[] = [];
  const beforeSnapshot = await captureUpdateSnapshot(updateRequest.siteId);

  let analysis: unknown;
  let plan: unknown;

  markStep(steps, 'analyze', 'in_progress');
  try {
    const analyzeInstruction = await loadPrompt('update-analyze', {
      prompt: updateRequest.prompt,
      siteId: updateRequest.siteId,
      baseUrl,
    });
    const analyzeCtx = await runtime.run(analyzeInstruction);
    const analyzeText = getAssistantText(analyzeCtx);
    analysis = parseJsonFromText(analyzeText);
    if (!analysis) {
      throw new Error('Update analysis did not return valid JSON');
    }
    markStep(steps, 'analyze', 'success', { analysis });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    errors.push({
      message: `Step analyze: ${msg}`,
      timestamp: new Date().toISOString(),
      code: 'step_analyze_error',
    });
    markStep(steps, 'analyze', 'failed', { error: msg });
    updateOk = false;
  }

  if (updateOk) {
    markStep(steps, 'plan', 'in_progress');
    try {
      const planInstruction = await loadPrompt('update-plan', {
        prompt: updateRequest.prompt,
        analysis: JSON.stringify(analysis),
      });
      const planCtx = await runtime.run(planInstruction);
      const planText = getAssistantText(planCtx);
      plan = parseJsonFromText(planText);
      if (!plan) {
        throw new Error('Update plan did not return valid JSON');
      }
      markStep(steps, 'plan', 'success', { plan });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      errors.push({
        message: `Step plan: ${msg}`,
        timestamp: new Date().toISOString(),
        code: 'step_plan_error',
      });
      markStep(steps, 'plan', 'failed', { error: msg });
      updateOk = false;
    }
  } else {
    markStep(steps, 'plan', 'failed', { skipped: true });
  }

  if (updateOk) {
    markStep(steps, 'apply', 'in_progress');
    try {
      const applyInstruction = await loadPrompt('update-apply', {
        prompt: updateRequest.prompt,
        plan: JSON.stringify(plan),
      });
      const applyCtx = await runtime.run(applyInstruction);
      const applyText = getAssistantText(applyCtx);
      const applyResult = parseJsonFromText(applyText);
      markStep(steps, 'apply', 'success', { result: applyResult });
      const afterSnapshot = await captureUpdateSnapshot(updateRequest.siteId);
      changeSummary = diffSnapshots(beforeSnapshot, afterSnapshot);
      updateStep(steps, 'apply', {
        details: {
          result: applyResult,
          changes: changeSummary,
          changeSummaryEmpty: changeSummary.length === 0,
        },
      });
      if (changeSummary.length === 0) {
        errors.push({
          message: 'Update completed but no tracked changes were detected.',
          timestamp: new Date().toISOString(),
          code: 'update_no_changes_detected',
        });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      errors.push({
        message: `Step apply: ${msg}`,
        timestamp: new Date().toISOString(),
        code: 'step_apply_error',
      });
      markStep(steps, 'apply', 'failed', { error: msg });
      updateOk = false;
    }
  } else {
    markStep(steps, 'apply', 'failed', { skipped: true });
  }

  let validation: ValidationResult = {
    cli: { databaseOk: false, filesystemOk: false, healthCheckOk: false },
    browser: { pagesLoaded: [], consoleErrors: [], screenshotsCaptured: 0 },
  };
  let screenshots: string[] = [];

  const reviewEnabled = input.enableReview ?? false;
  if (updateOk && reviewEnabled) {
    await runVisualReview(
      runtimeOptions,
      updateRequest.siteId,
      baseUrl,
      updateRequest.prompt,
      steps,
      errors,
      input.reviewCycles ?? 4,
    );
  } else {
    markStep(steps, 'review', 'success', { skipped: !reviewEnabled || !updateOk });
  }

  if (updateOk) {
    markStep(steps, 'validate', 'in_progress');
    const validationResult = await updateValidation(
      updateRequest.siteId,
      baseUrl,
      input.enableBrowser,
    );
    validation = validationResult.validation;
    screenshots = validationResult.screenshots;
    markStep(steps, 'validate', 'success');
  } else {
    markStep(steps, 'validate', 'failed', { skipped: true });
  }

  const healingCycles: HealingCycle[] = [];
  const validationOk =
    validation.cli.databaseOk &&
    validation.cli.filesystemOk &&
    validation.cli.healthCheckOk &&
    validation.browser.consoleErrors.length === 0;

  if (updateOk && !validationOk && input.enableHealing) {
    markStep(steps, 'heal', 'in_progress');
    const maxHealCycles = 2;
    for (let cycle = 1; cycle <= maxHealCycles; cycle += 1) {
      const cycleStartedAt = new Date().toISOString();
      await runtime.run(
        await loadPrompt('heal', {
          cycle: String(cycle),
        }),
      );
      const healingResult = await updateValidation(
        updateRequest.siteId,
        baseUrl,
        input.enableBrowser,
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
    markStep(steps, 'heal', 'success', { skipped: !input.enableHealing || !updateOk });
  }

  const finalOk =
    validation.cli.databaseOk &&
    validation.cli.filesystemOk &&
    validation.cli.healthCheckOk &&
    validation.browser.consoleErrors.length === 0;

  let exportBundle: string | undefined;
  if (updateOk && finalOk) {
    markStep(steps, 'export', 'in_progress');
    const exporter = createExportExecutor();
    const interimReport = await buildReport({
      siteId: updateRequest.siteId,
      status: 'success',
      steps,
      validation,
      screenshots,
      errors,
      startedAt,
      endedAt: new Date().toISOString(),
      update: {
        prompt: updateRequest.prompt,
        baseSpecPath: updateRequest.baseSpecPath,
        allowlistProfile: updateRequest.allowlistProfile,
      },
    });
    const exportResult = await exporter({
      operation: 'export',
      siteId: updateRequest.siteId,
      buildReport: interimReport,
      includeScreenshots: Boolean(screenshots.length),
      screenshotPaths: screenshots,
    });
    if (exportResult.status !== 'success') {
      errors.push({
        message: exportResult.error ?? 'Export failed',
        timestamp: new Date().toISOString(),
        code: 'export_failed',
      });
      markStep(steps, 'export', 'failed', { error: exportResult.error });
    } else {
      exportBundle = exportResult.bundlePath;
      markStep(steps, 'export', 'success', { bundlePath: exportBundle });
    }
  } else {
    markStep(steps, 'export', 'failed', { skipped: !updateOk || !finalOk });
  }

  const status: BuildReport['status'] = updateOk && finalOk ? 'success' : 'failed';
  const endedAt = new Date().toISOString();
  const report = await buildReport({
    siteId: updateRequest.siteId,
    status,
    steps,
    validation,
    screenshots,
    errors,
    startedAt,
    endedAt,
    exportBundle,
    update: {
      prompt: updateRequest.prompt,
      baseSpecPath: updateRequest.baseSpecPath,
      allowlistProfile: updateRequest.allowlistProfile,
    },
  });
  if (input.enableHealing && report.errors && report.errors.length) {
    report.healingCycles = healingCycles.length ? healingCycles : undefined;
  }

  markStep(steps, 'summary', 'in_progress');
  const summary = await generateUpdateSummary(
    runtimeOptions,
    updateRequest.prompt,
    report,
    changeSummary,
  );
  if (summary) {
    report.summary = summary;
    markStep(steps, 'summary', 'success');
  } else {
    markStep(steps, 'summary', 'success', { skipped: true, reason: 'summary generation failed' });
  }

  return report;
};

export const updateFromInput = async (input: UpdateOrchestratorInput) =>
  runWithTimeout(runUpdate(input), input.updateTimeoutMs);
