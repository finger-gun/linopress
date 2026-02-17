import { z } from 'zod';

export const templateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1).optional(),
  content: z.string().min(1),
  placeholders: z.array(z.string().min(1)).optional(),
});

export type TemplateDefinition = z.infer<typeof templateSchema>;

export const patternSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  content: z.string().min(1),
  placeholders: z.array(z.string().min(1)).optional(),
});

export type PatternDefinition = z.infer<typeof patternSchema>;
