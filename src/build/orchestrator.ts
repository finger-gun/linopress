import { promises as fs } from 'node:fs';
import path from 'node:path';
import { provisionStack } from '../stack/provision.js';
import type { BuildReport, BuildStep, ErrorLog, HealingCycle, SiteSpec } from '../models/types.js';
import { validateSiteSpec, validateSiteSpecExtraction } from '../models/schemas.js';
import { createWpCliExecutor } from '../tools/wp-cli-exec.js';
import { createBrowserExecutor } from '../tools/browser-exec.js';
import { createExportExecutor } from '../tools/export-exec.js';
import {
  createAgentRuntime,
  type AgentRuntimeOptions,
  type LlmProvider,
} from '../agent/runtime.js';

export type BuildOrchestratorInput = {
  siteId: string;
  prompt?: string;
  siteSpec?: SiteSpec;
  specPath?: string;
  port?: number;
  baseUrl?: string;
  enableBrowser?: boolean;
  enableHealing?: boolean;
  enableReview?: boolean;
  buildTimeoutMs?: number;
  skillTimeoutMs?: number;
  yolo?: boolean;
  modelProvider?: LlmProvider;
  model?: string;
  skillsDir?: string;
  /** Max visual review cycles (default 2) */
  reviewCycles?: number;
  /** Max self-healing cycles (default 2) */
  healingCycles?: number;
  /** Max pages to screenshot for visual review (default 5) */
  maxReviewPages?: number;
};

type ValidationResult = BuildReport['validation'];

const DEFAULT_PERMALINK = '/%postname%/';
const DEFAULT_BASE_URL = (port?: number) => `http://localhost:${port ?? 8080}`;

const createSteps = (includeExtract: boolean): BuildStep[] => {
  const steps: BuildStep[] = [];
  if (includeExtract) {
    steps.push({ id: 'extract', label: 'Extract site spec', status: 'pending' });
  }
  steps.push(
    { id: 'provision', label: 'Provision stack', status: 'pending' },
    { id: 'install', label: 'Install WordPress', status: 'pending' },
    { id: 'plugins', label: 'Install plugins', status: 'pending' },
    { id: 'theme', label: 'Generate theme', status: 'pending' },
    { id: 'content', label: 'Create content', status: 'pending' },
    { id: 'review', label: 'Visual review', status: 'pending' },
    { id: 'validate', label: 'Validate site', status: 'pending' },
    { id: 'heal', label: 'Self-heal (if needed)', status: 'pending' },
    { id: 'export', label: 'Export bundle', status: 'pending' },
    { id: 'summary', label: 'Generate summary', status: 'pending' },
  );
  return steps;
};

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
  console.log(`[build] ${id} -> ${status}`);
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Poll until the database is accepting connections and WP can talk to it.
const waitForDatabase = async (siteId: string, maxWaitMs = 60_000) => {
  const start = Date.now();
  const interval = 2_000;
  while (Date.now() - start < maxWaitMs) {
    try {
      const result = await runWpCli(siteId, 'wp db check', ['--skip-plugins', '--skip-themes']);
      if (result.exitCode === 0) return;
    } catch {
      // ignore — container may not be ready yet
    }
    await sleep(interval);
  }
  throw new Error(`Database for ${siteId} did not become ready within ${maxWaitMs}ms`);
};

const readSpecFromFile = async (specPath: string) => {
  const resolved = path.resolve(specPath);
  const raw = await fs.readFile(resolved, 'utf8');
  return JSON.parse(raw);
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

// Capture full-page screenshots of the site's pages using the browser tool.
const capturePageScreenshots = async (
  siteId: string,
  baseUrl: string,
  pages?: SiteSpec['pages'],
  maxPages = 5,
) => {
  const browser = createBrowserExecutor({ siteId });
  const sessionId = `review-${siteId}`;
  const screenshotPaths: Array<{ page: string; path: string }> = [];

  await browser({ operation: 'session_start', siteId, sessionId });
  try {
    const urls = pages?.length
      ? [
          { slug: 'home', url: baseUrl },
          ...pages
            .filter((p) => p.slug !== 'home' && p.slug !== '/')
            .slice(0, maxPages - 1)
            .map((p) => ({ slug: p.slug, url: `${baseUrl.replace(/\/$/, '')}/${p.slug}` })),
        ]
      : [{ slug: 'home', url: baseUrl }];

    for (const { slug, url } of urls) {
      try {
        await browser({
          operation: 'navigate',
          sessionId,
          url,
          waitUntil: 'networkidle',
        });
        const outputPath = `/tmp/${siteId}_review_${slug}_${Date.now()}.png`;
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
          `[review] Failed to screenshot ${slug}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  } finally {
    await browser({ operation: 'session_end', sessionId });
  }
  return screenshotPaths;
};

// Encode screenshot files as base64 data URIs for the LLM.
const screenshotsToBase64 = async (screenshotPaths: Array<{ page: string; path: string }>) => {
  const results: Array<{ page: string; dataUri: string }> = [];
  for (const { page, path: filePath } of screenshotPaths) {
    try {
      const buffer = await fs.readFile(filePath);
      const base64 = buffer.toString('base64');
      results.push({ page, dataUri: `data:image/png;base64,${base64}` });
    } catch (error) {
      console.log(
        `[review] Failed to read screenshot ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  return results;
};

// Run a visual review cycle: screenshot pages, send to LLM for review, let it fix issues.
const runVisualReview = async (
  runtimeOptions: AgentRuntimeOptions,
  siteId: string,
  baseUrl: string,
  siteSpec: SiteSpec,
  originalPrompt: string,
  steps: BuildStep[],
  errors: ErrorLog[],
  maxCycles = 2,
  maxPages = 5,
) => {
  markStep(steps, 'review', 'in_progress');
  const reviewDetails: Array<{ cycle: number; issuesFound: number; issuesFixed: number }> = [];

  for (let cycle = 1; cycle <= maxCycles; cycle += 1) {
    console.log(`[review] Cycle ${cycle}/${maxCycles}: capturing screenshots...`);

    // 1. Capture screenshots
    const screenshotPaths = await capturePageScreenshots(siteId, baseUrl, siteSpec.pages, maxPages);
    if (screenshotPaths.length === 0) {
      console.log('[review] No screenshots captured, skipping visual review');
      break;
    }

    // 2. Encode as base64
    const screenshots = await screenshotsToBase64(screenshotPaths);
    if (screenshots.length === 0) {
      console.log('[review] Failed to encode screenshots, skipping visual review');
      break;
    }

    // 3. Build the review instruction with embedded images
    const pageList = screenshots.map((s) => s.page).join(', ');
    const reviewInstruction = `Use the site-reviewer skill to review and fix this WordPress site.

You are looking at screenshots of these pages: ${pageList}.
Review cycle: ${cycle}/${maxCycles}.

Original prompt: "${originalPrompt}"
SiteSpec: ${JSON.stringify(siteSpec)}

Look at each screenshot carefully. Identify issues (invisible text, empty pages, broken layout, missing navigation, poor colors, missing content sections, default WordPress content, etc.).

Then FIX the issues you find using the wp_cli and file tools. Make targeted, surgical fixes — do not regenerate entire pages unless absolutely necessary.

After fixing, return a summary of what you found and fixed.`;

    // 4. Create a runtime and inject screenshots as image content parts
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
      // Override the user message content with multimodal parts (text + images).
      // The OpenAI adapter supports this via buildContentParts() even though
      // the sisu core types define content as string.
      const userMsg = (ctx as any).messages?.find?.((m: any) => m.role === 'user');
      if (userMsg) {
        (userMsg as any).content = imageContentParts;
      }
      await runtime.agent.handler()(ctx);

      // 5. Parse the review result from the assistant response
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
        // couldn't parse structured output, that's ok
      }

      reviewDetails.push({ cycle, issuesFound, issuesFixed });
      console.log(`[review] Cycle ${cycle}: found ${issuesFound} issues, fixed ${issuesFixed}`);

      // If no issues found, we're done
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
      // Don't fail the whole build for a review error — continue to validation
      break;
    }
  }

  markStep(steps, 'review', 'success', {
    cycles: reviewDetails,
    totalIssuesFound: reviewDetails.reduce((sum, d) => sum + d.issuesFound, 0),
    totalIssuesFixed: reviewDetails.reduce((sum, d) => sum + d.issuesFixed, 0),
  });
};

// Generate a human-readable markdown summary of the build.
const generateBuildSummary = async (
  runtimeOptions: AgentRuntimeOptions,
  siteSpec: SiteSpec,
  originalPrompt: string,
  report: BuildReport,
): Promise<string | undefined> => {
  try {
    const runtime = createAgentRuntime(runtimeOptions);

    const reviewStep = report.steps.find((s) => s.id === 'review');
    const reviewNotes = reviewStep?.details
      ? `\nReview details: ${JSON.stringify(reviewStep.details)}`
      : '';

    const instruction = `Generate a polished human-readable markdown summary of this WordPress site build.

The summary should follow this format:
# <Site Name>

## Summary
<1-2 sentence description of the site>

## Pages Created
<bullet list of pages with brief descriptions>

## Design
<1-2 sentences about the visual design, colors, fonts>

## Technical Details
- WordPress version: ${report.metadata.wpVersion}
- Theme: ${report.metadata.themeGenerated}
- Plugins: ${report.metadata.pluginsInstalled.join(', ') || 'None'}
- Build duration: ${Math.round(report.metadata.duration / 1000)}s
- Status: ${report.status}

## Review Notes
<bullet list of issues found and fixed during visual review, or "No issues found" if clean>

Original user prompt: "${originalPrompt}"
SiteSpec: ${JSON.stringify(siteSpec)}
Build steps: ${JSON.stringify(report.steps.map((s) => ({ id: s.id, status: s.status })))}
${reviewNotes}
${report.errors?.length ? `Errors: ${JSON.stringify(report.errors)}` : ''}

Return ONLY the markdown summary, no code fences, no preamble.`;

    const ctx = await runtime.run(instruction);
    const text = getAssistantText(ctx);
    return text || undefined;
  } catch (error) {
    console.log(
      `[summary] Failed to generate summary: ${error instanceof Error ? error.message : String(error)}`,
    );
    return undefined;
  }
};

// Uses the LLM skill to return a validated SiteSpec extraction JSON.
const extractSiteSpecFromPrompt = async (
  runtimeOptions: AgentRuntimeOptions,
  prompt: string,
  siteId: string,
  yolo?: boolean,
): Promise<SiteSpec> => {
  const runtime = createAgentRuntime(runtimeOptions);
  const yoloHint = yolo
    ? '\nIMPORTANT: --yolo mode is enabled. You MUST use themeMode "blank" — no parent themes allowed.'
    : '';
  const instruction = `Use the site-spec-extractor skill to extract a SiteSpec for this prompt.
Return ONLY valid JSON for the SiteSpec extraction result:
{
  "siteSpec": { ... },
  "warnings": [],
  "inferredDefaults": [],
  "confidence": 0.0,
  "ambiguities": []
}
${yoloHint}
Prompt: "${prompt}"`;

  const ctx = await runtime.run(instruction);
  const text = getAssistantText(ctx);
  if (!text) throw new Error('SiteSpec extraction returned no content');
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  const parsed = JSON.parse(cleaned);
  const extraction = validateSiteSpecExtraction(parsed);
  if (extraction.siteSpec.siteId !== siteId) {
    extraction.siteSpec.siteId = siteId;
  }
  if (!extraction.siteSpec.permalinkStructure) {
    extraction.siteSpec.permalinkStructure = DEFAULT_PERMALINK;
  }
  return extraction.siteSpec;
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

// Runs CLI validation and optional browser smoke checks.
const buildValidation = async (
  siteId: string,
  baseUrl: string,
  pages?: SiteSpec['pages'],
  enableBrowser?: boolean,
) => {
  const cli = await runCliValidation(siteId);
  if (!enableBrowser) {
    return {
      validation: { cli, browser: { pagesLoaded: [], consoleErrors: [], screenshotsCaptured: 0 } },
      screenshots: [] as string[],
    };
  }

  const pageUrls = (pages ?? []).map((page) => `${baseUrl.replace(/\/$/, '')}/${page.slug}`);
  const urls = pageUrls.length > 0 ? pageUrls : [baseUrl];
  const browser = await runBrowserValidation(siteId, urls);
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
    steps: params.steps,
    validation: params.validation,
    screenshots: params.screenshots,
    exportBundle: params.exportBundle,
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
        timer = setTimeout(() => reject(new Error('Build timed out')), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

// Orchestrates full build flow using skills and allowlisted tools.
export const runBuild = async (input: BuildOrchestratorInput): Promise<BuildReport> => {
  const startedAt = new Date().toISOString();
  const errors: ErrorLog[] = [];
  const steps = createSteps(Boolean(input.prompt) && !input.siteSpec);
  const runtimeOptions: AgentRuntimeOptions = {
    siteId: input.siteId,
    modelProvider: input.modelProvider,
    model: input.model,
    skillsDir: input.skillsDir,
    skillTimeoutMs: input.skillTimeoutMs,
  };

  let siteSpec = input.siteSpec;
  try {
    if (input.specPath) {
      const parsed = await readSpecFromFile(input.specPath);
      siteSpec = validateSiteSpec(parsed);
    }

    if (!siteSpec && input.prompt) {
      markStep(steps, 'extract', 'in_progress');
      siteSpec = await extractSiteSpecFromPrompt(
        runtimeOptions,
        input.prompt,
        input.siteId,
        input.yolo,
      );
      siteSpec = validateSiteSpec(siteSpec);
      markStep(steps, 'extract', 'success');
    }

    if (!siteSpec) {
      throw new Error('No SiteSpec provided. Use --spec or --prompt to create one.');
    }

    // --yolo forces blank theme mode (no parent theme, fully custom from scratch)
    if (input.yolo && siteSpec.themeMode !== 'blank') {
      console.log('[build] --yolo: forcing themeMode to "blank"');
      siteSpec.themeMode = 'blank';
    }

    const baseUrl = input.baseUrl ?? DEFAULT_BASE_URL(input.port);
    const runtime = createAgentRuntime(runtimeOptions);

    markStep(steps, 'provision', 'in_progress');
    await provisionStack({
      siteId: input.siteId,
      port: input.port,
      browser: Boolean(input.enableBrowser),
    });
    markStep(steps, 'provision', 'success');

    console.log('[build] Waiting for database readiness...');
    await waitForDatabase(input.siteId);
    console.log('[build] Database ready');

    const runAgentStep = async (id: string, instruction: string) => {
      markStep(steps, id, 'in_progress');
      try {
        await runtime.run(instruction);
        markStep(steps, id, 'success');
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        errors.push({
          message: `Step ${id}: ${msg}`,
          timestamp: new Date().toISOString(),
          code: `step_${id}_error`,
        });
        markStep(steps, id, 'failed', { error: msg });
      }
    };

    await runAgentStep(
      'install',
      `Use the wp-install skill to install WordPress for siteId "${siteSpec.siteId}" at ${baseUrl}.
Use admin email from SiteSpec if available and set timezone and language defaults.
SiteSpec: ${JSON.stringify(siteSpec)}`,
    );

    if (siteSpec.plugins?.length) {
      await runAgentStep(
        'plugins',
        `Use the plugin-installer skill to install and activate plugins: ${siteSpec.plugins.join(', ')}.
SiteSpec: ${JSON.stringify(siteSpec)}`,
      );
    } else {
      markStep(steps, 'plugins', 'success', { skipped: true });
    }

    await runAgentStep(
      'theme',
      `Use the theme-generator skill with themeMode "${siteSpec.themeMode}" and styleSeed "${siteSpec.styleSeed ?? ''}".
SiteSpec: ${JSON.stringify(siteSpec)}`,
    );

    if (siteSpec.pages?.length) {
      const originalPrompt = input.prompt ?? '';
      await runAgentStep(
        'content',
        `Use the page-builder skill to create pages from the SiteSpec.

IMPORTANT — Generate rich, visually impressive block content for EVERY page. Requirements:
- Each page MUST have a hero/header section with a background color from the theme palette (NEVER plain white or transparent)
- Each page MUST have at least 2-3 content sections with real, contextual text (not lorem ipsum)
- Use WordPress blocks: cover, group, columns, buttons, spacers, headings, paragraphs
- Use theme palette color references ("backgroundColor":"primary", "textColor":"contrast") — not hardcoded hex values
- Delete any remaining default WordPress content (Sample Page ID 2, Hello World post ID 1, default comment ID 1)
- Create a navigation menu with all pages in logical order (Home first, Contact last) and assign to the primary location
- Set the homepage as the static front page${originalPrompt ? `\n\nOriginal user prompt for content tone and context: "${originalPrompt}"` : ''}
${originalPrompt && /blog|news|article|journal|post/i.test(originalPrompt) ? '\nThe user wants a blog — create 3-5 sample blog posts with relevant categories, real content (2-3 paragraphs each), and excerpts. Set the blog page as the posts page.' : ''}
SiteSpec: ${JSON.stringify(siteSpec)}`,
      );
    } else {
      markStep(steps, 'content', 'success', { skipped: true });
    }

    // Visual review: screenshot pages, send to LLM, fix quality issues
    const reviewEnabled = input.enableReview ?? false;
    if (reviewEnabled) {
      await runVisualReview(
        runtimeOptions,
        input.siteId,
        baseUrl,
        siteSpec,
        input.prompt ?? siteSpec.prompt ?? '',
        steps,
        errors,
        input.reviewCycles ?? 2,
        input.maxReviewPages ?? 5,
      );
    } else {
      markStep(steps, 'review', 'success', { skipped: true, reason: 'review not enabled' });
    }

    markStep(steps, 'validate', 'in_progress');
    let { validation, screenshots } = await buildValidation(
      input.siteId,
      baseUrl,
      siteSpec.pages,
      input.enableBrowser,
    );
    markStep(steps, 'validate', 'success');

    const healingCycles: HealingCycle[] = [];
    const validationOk =
      validation.cli.databaseOk &&
      validation.cli.filesystemOk &&
      validation.cli.healthCheckOk &&
      validation.browser.consoleErrors.length === 0;

    if (!validationOk && input.enableHealing) {
      markStep(steps, 'heal', 'in_progress');
      const maxHealCycles = input.healingCycles ?? 2;
      for (let cycle = 1; cycle <= maxHealCycles; cycle += 1) {
        const startedAt = new Date().toISOString();
        await runtime.run(
          `Use the self-healing skill to resolve validation failures. Cycle ${cycle}.
SiteSpec: ${JSON.stringify(siteSpec)}`,
        );
        const healingResult = await buildValidation(
          input.siteId,
          baseUrl,
          siteSpec.pages,
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
          startedAt,
          finishedAt: new Date().toISOString(),
          actions: [{ action: 'self-heal', detail: okNow ? 'resolved' : 'retry' }],
          result: okNow ? 'success' : cycle === maxHealCycles ? 'failed' : 'partial',
        });

        if (okNow) break;
      }
      markStep(steps, 'heal', 'success');
    } else {
      markStep(steps, 'heal', 'success', { skipped: !input.enableHealing });
    }

    const finalOk =
      validation.cli.databaseOk &&
      validation.cli.filesystemOk &&
      validation.cli.healthCheckOk &&
      validation.browser.consoleErrors.length === 0;

    let exportBundle: string | undefined;
    if (finalOk) {
      markStep(steps, 'export', 'in_progress');
      const exporter = createExportExecutor();
      const interimReport = await buildReport({
        siteId: input.siteId,
        status: 'success',
        steps,
        validation,
        screenshots,
        errors,
        startedAt,
        endedAt: new Date().toISOString(),
      });
      const exportResult = await exporter({
        operation: 'export',
        siteId: input.siteId,
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
      markStep(steps, 'export', 'failed');
    }

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
      exportBundle,
    });
    if (input.enableHealing && report.errors && report.errors.length) {
      report.healingCycles = healingCycles.length ? healingCycles : undefined;
    }

    // Generate a human-readable build summary as the final step
    markStep(steps, 'summary', 'in_progress');
    const summary = await generateBuildSummary(
      runtimeOptions,
      siteSpec,
      input.prompt ?? siteSpec.prompt ?? '',
      report,
    );
    if (summary) {
      report.summary = summary;
      markStep(steps, 'summary', 'success');
    } else {
      markStep(steps, 'summary', 'success', { skipped: true, reason: 'summary generation failed' });
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

export const buildFromInput = async (input: BuildOrchestratorInput) =>
  runWithTimeout(runBuild(input), input.buildTimeoutMs);
