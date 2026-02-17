import { promises as fs } from 'node:fs';
import path from 'node:path';

const DEFAULT_PROMPTS_DIR = 'prompts';

let promptsDir = DEFAULT_PROMPTS_DIR;

/** Override the prompts directory (useful for testing). */
export const setPromptsDir = (dir: string) => {
  promptsDir = dir;
};

/**
 * Load a prompt template from a .prompt.md file and interpolate {{variables}}.
 *
 * Variables that are `undefined`, `null`, or empty string are replaced with ''.
 * Unmatched placeholders are left as-is so they're visible during debugging.
 */
export const loadPrompt = async (
  name: string,
  vars: Record<string, string | undefined> = {},
): Promise<string> => {
  const filePath = path.resolve(promptsDir, `${name}.prompt.md`);
  const raw = await fs.readFile(filePath, 'utf8');

  return raw.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = vars[key];
    return value ?? '';
  });
};
