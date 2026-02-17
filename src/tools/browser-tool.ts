import type { Tool } from '@sisu-ai/core';
import { z } from 'zod';

export const BROWSER_URL_ALLOWLIST = [
  /^http:\/\/localhost:\d+\/.*/,
  /^http:\/\/wordpress:\d+\/.*/,
] as const;

export type BrowserToolInput = z.infer<typeof browserToolSchema>;

export type BrowserConsoleError = {
  message: string;
  source?: string;
  line?: number;
  column?: number;
  stack?: string;
};

export type BrowserNetworkError = {
  url: string;
  status?: number;
  errorText?: string;
};

export type BrowserToolResult =
  | { status: 'ok'; sessionId: string }
  | { status: 'ok' }
  | {
      status: 'ok';
      url: string;
      statusCode?: number;
      loadTimeMs?: number;
      consoleErrors?: BrowserConsoleError[];
      networkErrors?: BrowserNetworkError[];
      errorScreenshotPath?: string;
    }
  | { status: 'ok'; path: string; fullPage: boolean }
  | { status: 'ok'; errors: BrowserConsoleError[] }
  | { status: 'ok'; exists?: boolean; text?: string; count?: number }
  | { status: 'ok'; metrics: Record<string, number> }
  | { status: 'ok'; result: unknown };

export type BrowserExecutor = (input: BrowserToolInput) => Promise<BrowserToolResult>;

const browserToolSchema = z.object({
  operation: z.enum([
    'session_start',
    'session_end',
    'navigate',
    'screenshot',
    'console_errors',
    'inspect',
    'metrics',
    'viewport',
    'execute',
    'clear',
  ]),
  siteId: z.string().min(1).optional(),
  sessionId: z.string().min(1).optional(),
  url: z.string().min(1).optional(),
  timeoutMs: z.number().int().positive().optional(),
  waitUntil: z.enum(['domcontentloaded', 'load', 'networkidle']).optional(),
  cdpEndpoint: z.string().min(1).optional(),
  autoConnect: z.boolean().optional(),
  viewport: z
    .object({
      width: z.number().int().positive(),
      height: z.number().int().positive(),
    })
    .optional(),
  fullPage: z.boolean().optional(),
  outputPath: z.string().min(1).optional(),
  errorScreenshotPath: z.string().min(1).optional(),
  selector: z.string().min(1).optional(),
  inspect: z
    .object({
      action: z.enum(['exists', 'text', 'count']),
    })
    .optional(),
  script: z.string().min(1).optional(),
  includeConsole: z.boolean().optional(),
  includeNetwork: z.boolean().optional(),
  captureOnError: z.boolean().optional(),
});

const requiresSession = new Set([
  'session_end',
  'navigate',
  'screenshot',
  'console_errors',
  'inspect',
  'metrics',
  'viewport',
  'execute',
  'clear',
]);

const requiresUrl = new Set(['navigate', 'screenshot']);

const validateBrowserUrl = (url: string) => {
  const allowed = BROWSER_URL_ALLOWLIST.some((pattern) => pattern.test(url));
  if (!allowed) {
    throw new Error(`browser url not allowlisted: ${url}`);
  }
};

export const createBrowserTool = (executor: BrowserExecutor): Tool<BrowserToolInput> => ({
  name: 'browser',
  description: 'Headless browser automation for local WordPress validation.',
  schema: browserToolSchema,
  handler: async (input) => {
    if (requiresSession.has(input.operation) && !input.sessionId) {
      throw new Error(`browser operation "${input.operation}" requires sessionId`);
    }

    if (requiresUrl.has(input.operation)) {
      if (!input.url) {
        throw new Error(`browser operation "${input.operation}" requires url`);
      }
      validateBrowserUrl(input.url);
    } else if (input.url) {
      validateBrowserUrl(input.url);
    }

    if (input.operation === 'inspect') {
      if (!input.selector) {
        throw new Error('browser inspect operation requires selector');
      }
      if (!input.inspect) {
        throw new Error('browser inspect operation requires inspect.action');
      }
    }

    if (input.waitUntil && input.operation !== 'navigate') {
      throw new Error('waitUntil is only valid for navigate operations');
    }

    return executor(input);
  },
});

export const browserTool = createBrowserTool(async () => {
  throw new Error('browser executor not configured');
});
