import type { Tool } from '@sisu-ai/core';
import { z } from 'zod';
import type { BuildReport, Manifest, ThemeMode } from '../models/types.js';

const themeSchema = z.object({
  name: z.string().min(1),
  parent: z.string().min(1).optional(),
  mode: z.enum(['parent', 'blank', 'user-selected']),
});

const exportToolSchema = z.object({
  operation: z.enum(['export']),
  siteId: z.string().min(1),
  outputDir: z.string().min(1).optional(),
  buildReport: z.custom<BuildReport>(),
  theme: themeSchema.optional(),
  plugins: z.array(z.string().min(1)).optional(),
  baseUrl: z.string().min(1).optional(),
  includeScreenshots: z.boolean().optional(),
  screenshotPaths: z.array(z.string().min(1)).optional(),
  maxSizeMb: z.number().positive().optional(),
});

export type ExportToolInput = z.infer<typeof exportToolSchema>;

export type ExportWarning = {
  type: 'secret' | 'size' | 'validation';
  message: string;
};

export type ExportToolResult = {
  status: 'success' | 'failed' | 'partial';
  bundlePath?: string;
  sizeBytes?: number;
  manifest?: Manifest;
  warnings?: ExportWarning[];
  exportDurationMs?: number;
  error?: string;
  tempDir?: string;
};

export type ExportExecutor = (input: ExportToolInput) => Promise<ExportToolResult>;

export const createExportTool = (executor: ExportExecutor): Tool<ExportToolInput> => ({
  name: 'export',
  description: 'Generate portable export bundle for a WordPress site.',
  schema: exportToolSchema,
  handler: async (input) => {
    if (input.operation !== 'export') {
      throw new Error(`Unsupported export operation: ${input.operation}`);
    }
    return executor(input);
  },
});

export const exportTool = createExportTool(async () => {
  throw new Error('export executor not configured');
});

export const buildManifest = (params: {
  siteId: string;
  wordpressVersion: string;
  phpVersion: string;
  plugins: string[];
  theme: { name: string; parent?: string; mode: ThemeMode };
  buildReport: BuildReport;
  createdAt?: string;
}): Manifest => ({
  version: '1.0',
  siteId: params.siteId,
  created: params.createdAt ?? new Date().toISOString(),
  wordpressVersion: params.wordpressVersion,
  phpVersion: params.phpVersion,
  plugins: params.plugins,
  theme: params.theme,
  buildReport: params.buildReport,
});
