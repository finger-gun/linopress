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
import { createWpCliExecutor } from '../tools/wp-cli-exec.js';

export type UpdateOrchestratorInput = {
  siteId: string;
  prompt: string;
  baseSpecPath?: string;
  allowlistProfile?: 'default' | 'strict';
  baseUrl?: string;
  enableBrowser?: boolean;
  enableHealing?: boolean;
  updateTimeoutMs?: number;
  skillTimeoutMs?: number;
  modelProvider?: LlmProvider;
  model?: string;
  skillsDir?: string;
};

type ValidationResult = BuildReport['validation'];

const UPDATE_TOOL_ALLOWLIST: ToolName[] = ['wp_cli', 'file', 'browser', 'export'];
const DEFAULT_BASE_URL = (port?: number) => `http://localhost:${port ?? 8080}`;

const createSteps = (): BuildStep[] => [
  { id: 'update', label: 'Apply update prompt', status: 'pending' },
  { id: 'validate', label: 'Validate site', status: 'pending' },
  { id: 'heal', label: 'Self-heal (if needed)', status: 'pending' },
  { id: 'export', label: 'Export bundle', status: 'pending' },
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

  markStep(steps, 'update', 'in_progress');
  try {
    const updateInstruction = await loadPrompt('update', {
      prompt: updateRequest.prompt,
      siteId: updateRequest.siteId,
      baseUrl,
      baseSpecPath: updateRequest.baseSpecPath ?? '',
    });
    await runtime.run(updateInstruction);
    markStep(steps, 'update', 'success');
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    errors.push({
      message: `Step update: ${msg}`,
      timestamp: new Date().toISOString(),
      code: 'step_update_error',
    });
    markStep(steps, 'update', 'failed', { error: msg });
    updateOk = false;
  }

  let validation: ValidationResult = {
    cli: { databaseOk: false, filesystemOk: false, healthCheckOk: false },
    browser: { pagesLoaded: [], consoleErrors: [], screenshotsCaptured: 0 },
  };
  let screenshots: string[] = [];

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

  return report;
};

export const updateFromInput = async (input: UpdateOrchestratorInput) =>
  runWithTimeout(runUpdate(input), input.updateTimeoutMs);
