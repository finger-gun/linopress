import type { Tool } from '@sisu-ai/core';
import type { ZodSchema } from 'zod';
import { createBrowserExecutor } from '../tools/browser-exec.js';
import { createBrowserTool } from '../tools/browser-tool.js';
import { createExportExecutor } from '../tools/export-exec.js';
import { createExportTool } from '../tools/export-tool.js';
import { createFileTool } from '../tools/file-tool.js';
import { createWpCliExecutor } from '../tools/wp-cli-exec.js';
import { createWpCliTool } from '../tools/wp-cli.js';

export const DEFAULT_TOOL_ALLOWLIST = ['wp_cli', 'file', 'browser', 'export'] as const;

export type ToolName = (typeof DEFAULT_TOOL_ALLOWLIST)[number];

export type ToolsetOptions = {
  siteId: string;
  timeoutMs?: number;
  browserCdpEndpoint?: string;
  autoConnectBrowser?: boolean;
  allowlist?: ToolName[];
};

const filterTools = (tools: Tool[], allowlist: ToolName[]) =>
  tools.filter((tool) => allowlist.includes(tool.name as ToolName));

// Format a Zod validation error into a message that helps the LLM
// understand what went wrong and how to fix it on the next attempt.
// Works with both Zod 3 and Zod 4 issue shapes.
const formatValidationGuidance = (
  toolName: string,
  issues: Array<{
    path: PropertyKey[];
    message: string;
    code?: string;
    expected?: string;
    values?: unknown[];
    input?: unknown;
  }>,
  rawInput: unknown,
): string => {
  const lines = issues.map((issue) => {
    const path = issue.path.length > 0 ? `"${issue.path.join('.')}"` : 'input';

    // Add specific guidance for common LLM mistakes
    if (issue.code === 'invalid_type' && issue.expected) {
      const got = typeof (issue.input ?? (issue as any).received);
      return `- ${path}: expected ${issue.expected}, but got ${got}. Please pass the correct type.`;
    }
    if (issue.code === 'invalid_value' && Array.isArray(issue.values)) {
      return `- ${path}: ${issue.message}. Valid values are: ${issue.values.join(', ')}`;
    }
    if (issue.code === 'unrecognized_keys') {
      return `- ${path}: ${issue.message}. Remove unexpected keys and check the tool's expected parameters.`;
    }
    return `- ${path}: ${issue.message}`;
  });

  return [
    `Tool "${toolName}" received invalid input. Please fix and retry:`,
    ...lines,
    `Your input was: ${safeStringify(rawInput)}`,
  ].join('\n');
};

const safeStringify = (value: unknown): string => {
  try {
    const str = JSON.stringify(value);
    // Truncate very large inputs so the error message stays readable
    return str.length > 500 ? `${str.slice(0, 500)}...` : str;
  } catch {
    return String(value);
  }
};

// Wrap tool handlers so that:
// 1. Schema validation happens inside the handler (not in sisu's tool-calling
//    loop), so validation errors become tool results the LLM can learn from
//    instead of exceptions that crash the agent step.
// 2. Handler errors are caught and returned as structured results so the
//    iterative tool calling loop can continue.
const safeTool = (tool: Tool): Tool => {
  const schema = tool.schema as ZodSchema | undefined;

  // Create a passthrough schema that preserves _def for JSON Schema conversion
  // (so the LLM adapter can still generate proper parameter docs for the API)
  // but whose .parse() just returns input unchanged — no throwing.
  const passthroughSchema = schema
    ? Object.create(schema, {
        parse: { value: (input: unknown) => input },
        safeParse: { value: (input: unknown) => ({ success: true, data: input }) },
      })
    : undefined;

  return {
    ...tool,
    schema: passthroughSchema,
    handler: async (input, ctx) => {
      try {
        // Validate inside the handler with safeParse
        let validatedInput = input;
        if (schema) {
          const result = schema.safeParse(input);
          if (!result.success) {
            return {
              status: 'error',
              error: formatValidationGuidance(tool.name, result.error.issues, input),
            };
          }
          validatedInput = result.data;
        }

        return await tool.handler(validatedInput, ctx);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { status: 'error', error: message };
      }
    },
  };
};

export const createToolset = ({
  siteId,
  timeoutMs,
  browserCdpEndpoint,
  autoConnectBrowser,
  allowlist,
}: ToolsetOptions): Tool[] => {
  if (!siteId) {
    throw new Error('createToolset requires siteId');
  }

  const wpCli = createWpCliTool(createWpCliExecutor({ siteId, timeoutMs }));
  const baseFile = createFileTool();
  const file: Tool = {
    ...baseFile,
    handler: async (input, ctx) =>
      baseFile.handler({ ...input, siteId } as typeof input & { siteId: string }, ctx as never),
  };
  const browser = createBrowserTool(
    createBrowserExecutor({
      siteId,
      timeoutMs,
      cdpEndpoint: browserCdpEndpoint,
      autoConnect: autoConnectBrowser,
    }),
  );
  const exportTool = createExportTool(createExportExecutor());

  const tools = [wpCli, file, browser, exportTool].map(safeTool);
  return filterTools(tools, allowlist ?? [...DEFAULT_TOOL_ALLOWLIST]);
};
