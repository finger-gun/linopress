import { z } from 'zod';

export const contentTemplateSchema = z.object({
  id: z.string().min(1),
  data: z.record(z.string(), z.unknown()).optional(),
});

export const businessInfoSchema = z.object({
  name: z.string().min(1),
  tagline: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional(),
  address: z.string().min(1).optional(),
  hours: z.string().min(1).optional(),
});

export const pageSpecSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  content: z.union([z.string(), contentTemplateSchema]),
  template: z.string().min(1).optional(),
  status: z.enum(['publish', 'draft', 'private', 'scheduled']).optional(),
  parentSlug: z.string().min(1).optional(),
});

export const siteSpecSchema = z.object({
  prompt: z.string().min(1),
  siteId: z.string().min(1),
  themeMode: z.enum(['parent', 'blank', 'user-selected']),
  styleSeed: z.string().min(1).optional(),
  plugins: z.array(z.string().min(1)).optional(),
  pages: z.array(pageSpecSchema).optional(),
  language: z.string().min(2).optional(),
  timezone: z.string().min(1).optional(),
  permalinkStructure: z.string().min(1).optional(),
  business: businessInfoSchema.optional(),
});

export const siteSpecExtractionSchema = z.object({
  siteSpec: siteSpecSchema,
  warnings: z.array(z.string().min(1)).default([]),
  inferredDefaults: z.array(z.string().min(1)).default([]),
  confidence: z.number().min(0).max(1),
  ambiguities: z.array(z.string().min(1)).default([]),
});

export const buildStepSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  status: z.enum(['pending', 'in_progress', 'success', 'failed']),
  startedAt: z.string().optional(),
  finishedAt: z.string().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export const errorLogSchema = z.object({
  message: z.string().min(1),
  stepId: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  timestamp: z.string().min(1),
  details: z.record(z.string(), z.unknown()).optional(),
});

export const healingCycleSchema = z.object({
  cycle: z.number().int().min(1),
  startedAt: z.string().min(1),
  finishedAt: z.string().min(1).optional(),
  actions: z
    .array(z.object({ action: z.string().min(1), detail: z.string().optional() }))
    .default([]),
  result: z.enum(['success', 'partial', 'failed']),
});

export const validationResultSchema = z.object({
  cli: z.object({
    databaseOk: z.boolean(),
    filesystemOk: z.boolean(),
    healthCheckOk: z.boolean(),
  }),
  browser: z.object({
    pagesLoaded: z.array(z.string().min(1)),
    consoleErrors: z.array(
      z.object({
        message: z.string().min(1),
        type: z.string().optional(),
        line: z.number().int().optional(),
      }),
    ),
    screenshotsCaptured: z.number().int().nonnegative(),
  }),
});

export const updateRequestSchema = z.object({
  siteId: z.string().min(1),
  prompt: z.string().min(1),
  baseSpecPath: z.string().min(1).optional(),
  allowlistProfile: z.enum(['default', 'strict']).optional(),
});

export const buildReportSchema = z.object({
  siteId: z.string().min(1),
  status: z.enum(['success', 'failed', 'partial']),
  mode: z.enum(['build', 'update']),
  steps: z.array(buildStepSchema),
  validation: validationResultSchema,
  screenshots: z.array(z.string().min(1)),
  exportBundle: z.string().min(1).optional(),
  errors: z.array(errorLogSchema).optional(),
  healingCycles: z.array(healingCycleSchema).optional(),
  summary: z.string().optional(),
  update: z
    .object({
      prompt: z.string().min(1),
      baseSpecPath: z.string().min(1).optional(),
      allowlistProfile: z.enum(['default', 'strict']).optional(),
    })
    .optional(),
  metadata: z.object({
    startTime: z.string().min(1),
    endTime: z.string().min(1),
    duration: z.number().nonnegative(),
    wpVersion: z.string().min(1),
    themeGenerated: z.string().min(1),
    pluginsInstalled: z.array(z.string().min(1)),
  }),
});

export const manifestSchema = z.object({
  version: z.string().min(1),
  siteId: z.string().min(1),
  created: z.string().min(1),
  wordpressVersion: z.string().min(1),
  phpVersion: z.string().min(1),
  plugins: z.array(z.string().min(1)),
  theme: z.object({
    name: z.string().min(1),
    parent: z.string().min(1).optional(),
    mode: z.enum(['parent', 'blank', 'user-selected']),
  }),
  buildReport: buildReportSchema,
});

export const validateSiteSpec = (input: unknown) => siteSpecSchema.parse(input);
export const validatePageSpec = (input: unknown) => pageSpecSchema.parse(input);
export const validateSiteSpecExtraction = (input: unknown) => siteSpecExtractionSchema.parse(input);
export const validateUpdateRequest = (input: unknown) => updateRequestSchema.parse(input);
export const validateBuildReport = (input: unknown) => buildReportSchema.parse(input);
export const validateValidationResult = (input: unknown) => validationResultSchema.parse(input);
export const validateManifest = (input: unknown) => manifestSchema.parse(input);
