import type { BuildStep, ErrorLog } from '../models/types.js';

export type BuildState = {
  steps: BuildStep[];
  errors: ErrorLog[];
  startedAt: string;
  updatedAt?: string;
};

type StateContainer = { state?: Record<string, unknown> };

export const ensureBuildState = (ctx: StateContainer): BuildState => {
  if (!ctx.state) {
    ctx.state = {};
  }
  if (!ctx.state.linopress) {
    ctx.state.linopress = {
      steps: [],
      errors: [],
      startedAt: new Date().toISOString(),
    } satisfies BuildState;
  }
  return ctx.state.linopress as BuildState;
};

export const recordBuildStep = (ctx: StateContainer, step: BuildStep) => {
  const state = ensureBuildState(ctx);
  state.steps.push(step);
  state.updatedAt = new Date().toISOString();
};

export const updateBuildStep = (
  ctx: StateContainer,
  stepId: string,
  update: Partial<BuildStep>,
) => {
  const state = ensureBuildState(ctx);
  const existing = state.steps.find((step) => step.id === stepId);
  if (existing) {
    Object.assign(existing, update);
    state.updatedAt = new Date().toISOString();
  }
};

export const recordBuildError = (ctx: StateContainer, error: ErrorLog) => {
  const state = ensureBuildState(ctx);
  state.errors.push(error);
  state.updatedAt = new Date().toISOString();
};
