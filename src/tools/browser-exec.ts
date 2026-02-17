import { assertStackExists, getStackPaths } from '../stack/compose.js';
import { runCommand } from './docker.js';
import type {
  BrowserConsoleError,
  BrowserExecutor,
  BrowserNetworkError,
  BrowserToolInput,
  BrowserToolResult,
} from './browser-tool.js';

export type BrowserExecOptions = {
  siteId?: string;
  timeoutMs?: number;
  cdpEndpoint?: string;
  autoConnect?: boolean;
};

const DEFAULT_TIMEOUT_MS = 60_000;
const NAVIGATION_TIMEOUT_MS = 30_000;

const parseJsonOutput = (stdout: string): unknown | undefined => {
  const trimmed = stdout.trim();
  if (!trimmed) return undefined;
  try {
    return JSON.parse(trimmed);
  } catch {
    return undefined;
  }
};

const unwrapData = (value: unknown) => {
  if (value && typeof value === 'object' && 'data' in value) {
    return (value as { data?: unknown }).data;
  }
  return value;
};

const normalizeConsoleErrors = (data: unknown): BrowserConsoleError[] => {
  if (Array.isArray(data)) {
    return data.map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return { message: String(entry) };
      }
      const record = entry as Record<string, unknown>;
      return {
        message: typeof record.message === 'string' ? record.message : JSON.stringify(record),
        source: typeof record.source === 'string' ? record.source : undefined,
        line: typeof record.line === 'number' ? record.line : undefined,
        column: typeof record.column === 'number' ? record.column : undefined,
        stack: typeof record.stack === 'string' ? record.stack : undefined,
      };
    });
  }

  if (data && typeof data === 'object' && 'errors' in data) {
    return normalizeConsoleErrors((data as { errors?: unknown }).errors);
  }

  if (typeof data === 'string') {
    return data
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => ({ message: line }));
  }

  return [];
};

const normalizeNetworkErrors = (data: unknown): BrowserNetworkError[] => {
  if (!data || typeof data !== 'object') return [];
  const requests = Array.isArray((data as { requests?: unknown }).requests)
    ? ((data as { requests?: unknown }).requests as Array<Record<string, unknown>>)
    : [];
  return requests
    .filter((request) => {
      const status = typeof request.status === 'number' ? request.status : undefined;
      return Boolean((status && status >= 400) || request.error || request.failed);
    })
    .map((request) => ({
      url: typeof request.url === 'string' ? request.url : 'unknown',
      status: typeof request.status === 'number' ? request.status : undefined,
      errorText: typeof request.error === 'string' ? request.error : undefined,
    }));
};

const toArgs = (input: BrowserToolInput, options?: BrowserExecOptions) => {
  const args: string[] = [];
  if (input.sessionId) {
    args.push('--session', input.sessionId);
  }
  const cdpEndpoint = input.cdpEndpoint ?? options?.cdpEndpoint;
  const autoConnect = input.autoConnect ?? options?.autoConnect;
  if (cdpEndpoint) {
    args.push('--cdp', cdpEndpoint);
  } else if (autoConnect) {
    args.push('--auto-connect');
  }
  return args;
};

const ensureBrowserContainer = async (siteId: string) => {
  await assertStackExists(siteId);
  const { composePath, envPath, projectName } = getStackPaths(siteId);
  const args = [
    'compose',
    '-f',
    composePath,
    '--env-file',
    envPath,
    '-p',
    projectName,
    '--profile',
    'browser',
    'up',
    '-d',
    'browser',
  ];
  const result = await runCommand('docker', args, 120_000);
  if (result.exitCode !== 0) {
    throw new Error(`Failed to start browser container: ${result.stderr || result.stdout}`);
  }
};

const stopBrowserContainer = async (siteId: string) => {
  await assertStackExists(siteId);
  const { composePath, envPath, projectName } = getStackPaths(siteId);
  const args = [
    'compose',
    '-f',
    composePath,
    '--env-file',
    envPath,
    '-p',
    projectName,
    'stop',
    'browser',
  ];
  const result = await runCommand('docker', args, 60_000);
  if (result.exitCode !== 0) {
    throw new Error(`Failed to stop browser container: ${result.stderr || result.stdout}`);
  }
};

const runAgentBrowser = async (args: string[], timeoutMs: number) => {
  const result = await runCommand('agent-browser', args, timeoutMs);
  if (result.exitCode !== 0) {
    throw new Error(result.stderr || result.stdout || 'agent-browser command failed');
  }
  return result.stdout;
};

const parseScreenshotPath = (stdout: string) => {
  const trimmed = stdout.trim();
  if (!trimmed) return '';
  const lines = trimmed
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  return lines[lines.length - 1] ?? '';
};

const buildPerformanceScript = () =>
  `(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    if (!nav) return {};
    return {
      domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
      loadEvent: Math.round(nav.loadEventEnd),
      responseEnd: Math.round(nav.responseEnd),
      startTime: Math.round(nav.startTime),
    };
  })()`;

export const createBrowserExecutor =
  (options?: BrowserExecOptions): BrowserExecutor =>
  async (input): Promise<BrowserToolResult> => {
    const timeoutMs = input.timeoutMs ?? options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const sessionArgs = toArgs(input, options);
    const siteId = input.siteId ?? options?.siteId;

    if (siteId && input.operation === 'session_start') {
      await ensureBrowserContainer(siteId);
    }

    switch (input.operation) {
      case 'session_start': {
        const args = [...sessionArgs, 'session'];
        await runAgentBrowser(args, timeoutMs);
        return { status: 'ok', sessionId: input.sessionId ?? 'default' };
      }
      case 'session_end': {
        const args = [...sessionArgs, 'close'];
        await runAgentBrowser(args, timeoutMs);
        if (siteId) {
          await stopBrowserContainer(siteId);
        }
        return { status: 'ok' };
      }
      case 'navigate': {
        const start = Date.now();
        const openArgs = [...sessionArgs, 'open', input.url!];
        await runAgentBrowser(openArgs, timeoutMs);
        const waitUntil = input.waitUntil ?? 'domcontentloaded';
        const waitArgs = [...sessionArgs, 'wait', '--load', waitUntil];
        await runAgentBrowser(waitArgs, input.timeoutMs ?? NAVIGATION_TIMEOUT_MS);
        const loadTimeMs = Date.now() - start;

        const result: BrowserToolResult = {
          status: 'ok',
          url: input.url!,
          loadTimeMs,
        };

        if (input.includeConsole) {
          const errorsOut = await runAgentBrowser([...sessionArgs, 'errors', '--json'], timeoutMs);
          const errors = normalizeConsoleErrors(
            unwrapData(parseJsonOutput(errorsOut)) ?? errorsOut,
          );
          result.consoleErrors = errors;

          if (input.captureOnError && errors.length > 0) {
            const screenshotArgs = [...sessionArgs, 'screenshot'];
            if (input.errorScreenshotPath) {
              screenshotArgs.push(input.errorScreenshotPath);
            }
            const screenshotOut = await runAgentBrowser(screenshotArgs, timeoutMs);
            result.errorScreenshotPath =
              parseScreenshotPath(screenshotOut) || input.errorScreenshotPath;
          }
        }

        if (input.includeNetwork) {
          const networkOut = await runAgentBrowser(
            [...sessionArgs, 'network', 'requests', '--json'],
            timeoutMs,
          );
          const networkData = unwrapData(parseJsonOutput(networkOut)) ?? networkOut;
          result.networkErrors = normalizeNetworkErrors(networkData);
        }

        return result;
      }
      case 'screenshot': {
        const args = [...sessionArgs, 'screenshot'];
        if (input.fullPage) {
          args.push('--full');
        }
        if (input.outputPath) {
          args.push(input.outputPath);
        }
        const stdout = await runAgentBrowser(args, timeoutMs);
        return {
          status: 'ok',
          path: parseScreenshotPath(stdout) || input.outputPath || '',
          fullPage: Boolean(input.fullPage),
        };
      }
      case 'console_errors': {
        const stdout = await runAgentBrowser([...sessionArgs, 'errors', '--json'], timeoutMs);
        const data = unwrapData(parseJsonOutput(stdout)) ?? stdout;
        return { status: 'ok', errors: normalizeConsoleErrors(data) };
      }
      case 'inspect': {
        const action = input.inspect?.action ?? 'exists';
        if (action === 'exists') {
          const stdout = await runAgentBrowser(
            [...sessionArgs, 'is', 'visible', input.selector!, '--json'],
            timeoutMs,
          );
          const data = unwrapData(parseJsonOutput(stdout));
          const exists = typeof data === 'boolean' ? data : Boolean(data);
          return { status: 'ok', exists };
        }
        if (action === 'count') {
          const stdout = await runAgentBrowser(
            [...sessionArgs, 'get', 'count', input.selector!, '--json'],
            timeoutMs,
          );
          const data = unwrapData(parseJsonOutput(stdout));
          const count = typeof data === 'number' ? data : Number(data ?? 0);
          return { status: 'ok', count };
        }
        const stdout = await runAgentBrowser(
          [...sessionArgs, 'get', 'text', input.selector!, '--json'],
          timeoutMs,
        );
        const data = unwrapData(parseJsonOutput(stdout));
        const text = typeof data === 'string' ? data : stdout.trim();
        return { status: 'ok', text };
      }
      case 'metrics': {
        const stdout = await runAgentBrowser(
          [...sessionArgs, 'eval', buildPerformanceScript(), '--json'],
          timeoutMs,
        );
        const data = unwrapData(parseJsonOutput(stdout));
        if (data && typeof data === 'object') {
          return { status: 'ok', metrics: data as Record<string, number> };
        }
        return { status: 'ok', metrics: {} };
      }
      case 'viewport': {
        if (!input.viewport) {
          throw new Error('viewport operation requires viewport dimensions');
        }
        const { width, height } = input.viewport;
        await runAgentBrowser(
          [...sessionArgs, 'set', 'viewport', String(width), String(height)],
          timeoutMs,
        );
        return { status: 'ok' };
      }
      case 'execute': {
        if (!input.script) {
          throw new Error('execute operation requires script');
        }
        const stdout = await runAgentBrowser(
          [...sessionArgs, 'eval', input.script, '--json'],
          timeoutMs,
        );
        const data = unwrapData(parseJsonOutput(stdout));
        return { status: 'ok', result: data ?? stdout.trim() };
      }
      case 'clear': {
        await runAgentBrowser([...sessionArgs, 'console', '--clear'], timeoutMs);
        await runAgentBrowser([...sessionArgs, 'errors', '--clear'], timeoutMs);
        await runAgentBrowser([...sessionArgs, 'cookies', 'clear'], timeoutMs);
        await runAgentBrowser([...sessionArgs, 'storage', 'local', 'clear'], timeoutMs);
        await runAgentBrowser([...sessionArgs, 'storage', 'session', 'clear'], timeoutMs);
        return { status: 'ok' };
      }
      default:
        throw new Error(`Unsupported browser operation: ${input.operation}`);
    }
  };
