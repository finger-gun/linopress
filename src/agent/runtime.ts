import 'dotenv/config';
import { Agent, createCtx, type Tool } from '@sisu-ai/core';
import { anthropicAdapter } from '@sisu-ai/adapter-anthropic';
import { openAIAdapter } from '@sisu-ai/adapter-openai';
import { inputToMessage, conversationBuffer } from '@sisu-ai/mw-conversation-buffer';
import { registerTools } from '@sisu-ai/mw-register-tools';
import { skillsMiddleware } from '@sisu-ai/mw-skills';
import { toolCalling } from '@sisu-ai/mw-tool-calling';
import { traceViewer } from '@sisu-ai/mw-trace-viewer';
import { DEFAULT_TOOL_ALLOWLIST, createToolset, type ToolName } from './tools.js';
import { ensureBuildState, recordBuildError } from './state.js';

export type LlmProvider = 'openai' | 'anthropic';

export type AgentRuntimeOptions = {
  siteId: string;
  systemPrompt?: string;
  modelProvider?: LlmProvider;
  model?: string;
  tools?: Tool[];
  toolAllowlist?: ToolName[];
  skillsDir?: string;
  skillTimeoutMs?: number;
  conversationWindow?: number;
  browserCdpEndpoint?: string;
  autoConnectBrowser?: boolean;
};

const DEFAULT_SYSTEM_PROMPT =
  'You are Linopress, an agentic WordPress automation system. Use skills and tools to build sites deterministically.';

const resolveProvider = (value?: string): LlmProvider => {
  const normalized = (value ?? '').toLowerCase();
  if (normalized === 'anthropic' || normalized === 'claude') return 'anthropic';
  if (normalized === 'openai' || normalized === 'gpt') return 'openai';
  return 'anthropic';
};

const resolveModel = (provider: LlmProvider, model?: string) => {
  if (provider === 'openai') {
    return openAIAdapter({ model: model ?? process.env.LLM_MODEL ?? 'gpt-4o-mini' });
  }
  return anthropicAdapter({ model: model ?? process.env.LLM_MODEL ?? 'claude-3-5-sonnet' });
};

const withTimeout = (timeoutMs?: number) => async (ctx: unknown, next: () => Promise<void>) => {
  if (!timeoutMs) {
    await next();
    return;
  }

  let timer: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      next(),
      new Promise<void>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`Agent execution timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

const buildStateMiddleware =
  () => async (ctx: { state?: Record<string, unknown> }, next: () => Promise<void>) => {
    ensureBuildState(ctx);
    await next();
  };

const errorRecorder =
  () => async (ctx: { state?: Record<string, unknown> }, next: () => Promise<void>) => {
    try {
      await next();
    } catch (error) {
      recordBuildError(ctx, {
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  };

const guardSkillCycles = () => async (ctx: any, next: () => Promise<void>) => {
  const tools = ctx?.tools as {
    get?: (name: string) => Tool | undefined;
    set?: (name: string, tool: Tool) => void;
  };
  if (tools?.get && tools?.set) {
    const useSkill = tools.get('use_skill');
    if (useSkill && !(useSkill as Tool & { __linopressWrapped?: boolean }).__linopressWrapped) {
      const wrapped: Tool = {
        ...useSkill,
        handler: async (input, toolCtx) => {
          const name =
            input && typeof input === 'object' && 'name' in input
              ? String((input as { name?: unknown }).name)
              : 'unknown-skill';
          const host = (toolCtx as { state?: Record<string, unknown> }) ?? ctx;
          if (!host.state) host.state = {};
          const stack = Array.isArray(host.state.linopressSkillStack)
            ? (host.state.linopressSkillStack as string[])
            : [];
          if (stack.includes(name)) {
            throw new Error(`Skill cycle detected: ${[...stack, name].join(' -> ')}`);
          }
          stack.push(name);
          host.state.linopressSkillStack = stack;
          try {
            return await useSkill.handler(input, toolCtx as never);
          } finally {
            stack.pop();
          }
        },
      };
      (wrapped as Tool & { __linopressWrapped?: boolean }).__linopressWrapped = true;
      tools.set('use_skill', wrapped);
    }
  }
  await next();
};

const registerShutdownHandlers = (controller: AbortController) => {
  const shutdown = (signal: NodeJS.Signals) => {
    controller.abort();
    process.off('SIGINT', shutdown);
    process.off('SIGTERM', shutdown);
    process.on(signal, () => process.exit(0));
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

export const createAgentRuntime = (options: AgentRuntimeOptions) => {
  const provider = options.modelProvider ?? resolveProvider(process.env.LLM_PROVIDER);
  const model = resolveModel(provider, options.model);
  const toolAllowlist = options.toolAllowlist ?? [...DEFAULT_TOOL_ALLOWLIST];
  const tools =
    options.tools ??
    createToolset({
      siteId: options.siteId,
      allowlist: toolAllowlist,
      browserCdpEndpoint: options.browserCdpEndpoint,
      autoConnectBrowser: options.autoConnectBrowser ?? true,
    });

  const agent = new Agent()
    .use(errorRecorder())
    .use(traceViewer())
    .use(buildStateMiddleware())
    .use(registerTools(tools))
    .use(
      skillsMiddleware({
        directories: [options.skillsDir ?? 'skills'],
        cwd: process.cwd(),
        maxFileSize: 100_000,
        cacheTtl: 5 * 60 * 1000,
      }),
    )
    .use(guardSkillCycles())
    .use(inputToMessage)
    .use(conversationBuffer({ window: options.conversationWindow ?? 8 }))
    .use(withTimeout(options.skillTimeoutMs))
    .use(toolCalling);

  const controller = new AbortController();
  registerShutdownHandlers(controller);

  const createContext = (input: string, systemPrompt?: string) =>
    createCtx({
      model,
      input,
      systemPrompt: systemPrompt ?? options.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
      signal: controller.signal,
    });

  const run = async (input: string, systemPrompt?: string) => {
    const ctx = createContext(input, systemPrompt);
    await agent.handler()(ctx);
    return ctx;
  };

  return { agent, createContext, run, tools };
};
