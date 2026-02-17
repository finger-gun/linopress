import type { Tool } from '@sisu-ai/core';
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

// Wrap tool handlers to catch errors and return them as structured results
// instead of throwing, so the iterative tool calling loop can continue.
const safeTool = (tool: Tool): Tool => ({
  ...tool,
  handler: async (input, ctx) => {
    try {
      return await tool.handler(input, ctx);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { status: 'error', error: message };
    }
  },
});

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
