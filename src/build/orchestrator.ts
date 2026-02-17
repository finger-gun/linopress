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
  buildTimeoutMs?: number;
  skillTimeoutMs?: number;
  modelProvider?: LlmProvider;
  model?: string;
  skillsDir?: string;
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
    { id: 'validate', label: 'Validate site', status: 'pending' },
    { id: 'heal', label: 'Self-heal (if needed)', status: 'pending' },
    { id: 'export', label: 'Export bundle', status: 'pending' },
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

// Uses the LLM skill to return a validated SiteSpec extraction JSON.
const extractSiteSpecFromPrompt = async (
  runtimeOptions: AgentRuntimeOptions,
  prompt: string,
  siteId: string,
): Promise<SiteSpec> => {
  const runtime = createAgentRuntime(runtimeOptions);
  const instruction = `Use the site-spec-extractor skill to extract a SiteSpec for this prompt.
Return ONLY valid JSON for the SiteSpec extraction result:
{
  "siteSpec": { ... },
  "warnings": [],
  "inferredDefaults": [],
  "confidence": 0.0,
  "ambiguities": []
}

Prompt: "${prompt}"`;

  const ctx = await runtime.run(instruction);
  const text = getAssistantText(ctx);
  if (!text) throw new Error('SiteSpec extraction returned no content');
  const parsed = JSON.parse(text);
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
  const results = await Promise.allSettled([
    runWpCli(siteId, 'wp db check', ['--skip-plugins', '--skip-themes']),
    runWpCli(siteId, 'wp doctor check', ['--skip-plugins', '--skip-themes']),
  ]);

  const databaseOk = results[0].status === 'fulfilled' && results[0].value.exitCode === 0;
  const healthCheckOk = results[1].status === 'fulfilled' && results[1].value.exitCode === 0;
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
      siteSpec = await extractSiteSpecFromPrompt(runtimeOptions, input.prompt, input.siteId);
      siteSpec = validateSiteSpec(siteSpec);
      markStep(steps, 'extract', 'success');
    }

    if (!siteSpec) {
      throw new Error('No SiteSpec provided. Use --spec or --prompt to create one.');
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

    const runAgentStep = async (id: string, instruction: string) => {
      markStep(steps, id, 'in_progress');
      await runtime.run(instruction);
      markStep(steps, id, 'success');
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
      await runAgentStep(
        'content',
        `Use the page-builder skill to create pages from the SiteSpec.
SiteSpec: ${JSON.stringify(siteSpec)}`,
      );
    } else {
      markStep(steps, 'content', 'success', { skipped: true });
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
      for (let cycle = 1; cycle <= 2; cycle += 1) {
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
          result: okNow ? 'success' : cycle === 2 ? 'failed' : 'partial',
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

    if (finalOk) {
      markStep(steps, 'export', 'in_progress');
      const exporter = createExportExecutor();
      await exporter({
        operation: 'export',
        siteId: input.siteId,
        buildReport: await buildReport({
          siteId: input.siteId,
          status: 'success',
          steps,
          validation,
          screenshots,
          errors,
          startedAt,
          endedAt: new Date().toISOString(),
        }),
        includeScreenshots: Boolean(screenshots.length),
        screenshotPaths: screenshots,
      });
      markStep(steps, 'export', 'success');
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
    });
    if (input.enableHealing && report.errors && report.errors.length) {
      report.healingCycles = healingCycles.length ? healingCycles : undefined;
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
