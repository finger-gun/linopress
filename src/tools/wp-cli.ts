import type { Tool } from '@sisu-ai/core';
import { z } from 'zod';

export const WP_CLI_ALLOWLIST = [
  'wp comment delete',
  'wp comment list',
  'wp config set',
  'wp core install',
  'wp core is-installed',
  'wp core version',
  'wp db reset',
  'wp plugin install',
  'wp plugin activate',
  'wp plugin deactivate',
  'wp plugin list',
  'wp plugin uninstall',
  'wp theme install',
  'wp theme activate',
  'wp theme list',
  'wp term create',
  'wp term list',
  'wp media import',
  'wp post delete',
  'wp post create',
  'wp post list',
  'wp post meta update',
  'wp post update',
  'wp rewrite flush',
  'wp rewrite structure',
  'wp menu create',
  'wp menu list',
  'wp menu item add-*',
  'wp menu location assign',
  'wp option get',
  'wp option update',
  'wp language core install',
  'wp language core list',
  'wp db export',
  'wp db check',
  'wp doctor check',
  'wp user list',
] as const;

export type WpCliInput = {
  command: string;
  args?: string[];
};

export type WpCliResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
  json?: unknown;
};

export type WpCliExecutor = (input: WpCliInput) => Promise<WpCliResult>;

const wpCliSchema = z.object({
  command: z.string().min(1),
  args: z.array(z.string().min(1)).optional(),
});

const matchesAllowlist = (command: string, allowlist: readonly string[]) =>
  allowlist.some((entry) => {
    if (!entry.includes('*')) {
      return command === entry;
    }

    const prefix = entry.replace('*', '');
    return command.startsWith(prefix);
  });

export const validateWpCliCommand = (command: string) => {
  if (!command.startsWith('wp ')) {
    throw new Error('wp-cli command must start with "wp".');
  }

  if (!matchesAllowlist(command, WP_CLI_ALLOWLIST)) {
    throw new Error(`wp-cli command not allowlisted: ${command}`);
  }
};

const normalizeWpCommand = (command: string) => {
  const trimmed = command.trim();
  if (trimmed.startsWith('wp ')) return trimmed;
  return `wp ${trimmed}`;
};

const splitWpCliInput = (command: string, args?: string[]) => {
  const normalized = normalizeWpCommand(command);
  if (args && args.length > 0) {
    return { command: normalized, args };
  }

  const tokens = normalized.split(/\s+/);
  if (tokens.length <= 2) {
    return { command: normalized, args: [] as string[] };
  }

  for (let i = tokens.length; i >= 2; i -= 1) {
    const candidate = tokens.slice(0, i).join(' ');
    if (matchesAllowlist(candidate, WP_CLI_ALLOWLIST)) {
      return { command: candidate, args: tokens.slice(i) };
    }
  }

  return { command: normalized, args: [] as string[] };
};

const shouldParseJson = (args?: string[]) =>
  Boolean(args?.some((arg) => arg === '--format=json' || arg === '--format=json-pretty'));

const parseJsonOutput = (result: WpCliResult, args?: string[]) => {
  if (!shouldParseJson(args)) return result;

  try {
    const parsed = JSON.parse(result.stdout.trim());
    return { ...result, json: parsed };
  } catch {
    return result;
  }
};

// Strip wrapping quotes that LLMs sometimes add around arg values.
// e.g. '--title="Solstice Yoga Studio"' -> '--title=Solstice Yoga Studio'
// Also recombines split quoted args: ["--title=\"Solstice", "Yoga", "Studio\""] -> ["--title=Solstice Yoga Studio"]
const recombineQuotedArgs = (args: string[]): string[] => {
  const result: string[] = [];
  let accumulator: string[] | null = null;

  for (const arg of args) {
    if (accumulator) {
      accumulator.push(arg);
      if (arg.endsWith('"') || arg.endsWith("'")) {
        const joined = accumulator.join(' ');
        result.push(joined.replace(/^(--?\w+=)?["'](.*)["']$/, '$1$2'));
        accumulator = null;
      }
      continue;
    }

    // Check for start of a split quoted value: --title="Solstice (no closing quote)
    const match = arg.match(/^(--?\w+=)["'](.*)$/);
    if (match && !arg.endsWith('"') && !arg.endsWith("'")) {
      accumulator = [arg];
      continue;
    }

    // Strip wrapping quotes from self-contained args: --title="value"
    result.push(arg.replace(/^(--?\w+=)["'](.*)["']$/, '$1$2'));
  }

  // If we have an unclosed accumulator, push what we have
  if (accumulator) {
    const joined = accumulator.join(' ');
    result.push(joined.replace(/^(--?\w+=)?["'](.*)["']?$/, '$1$2'));
  }

  return result;
};

const sanitizeArgs = (args?: string[]) => {
  if (!args || args.length === 0) return [];

  const combined = recombineQuotedArgs(args);

  return combined.map((arg) => {
    if (arg.includes('\u0000') || arg.includes('\n') || arg.includes('\r')) {
      throw new Error('wp-cli arguments must not include control characters.');
    }

    if (/[;&|<>]/.test(arg)) {
      throw new Error('wp-cli arguments contain disallowed shell characters.');
    }

    return arg;
  });
};

export const createWpCliTool = (executor: WpCliExecutor): Tool<WpCliInput> => ({
  name: 'wp_cli',
  description: 'Execute allowlisted wp-cli commands in the WordPress container.',
  schema: wpCliSchema,
  handler: async ({ command, args }) => {
    const startedAt = Date.now();
    const split = splitWpCliInput(command, args);
    const safeArgs = sanitizeArgs(split.args);
    const normalizedCommand = split.command;
    logWpCliStart(normalizedCommand, safeArgs);

    try {
      validateWpCliCommand(normalizedCommand);
      const result = await executor({ command: normalizedCommand, args: safeArgs });
      logWpCliResult(normalizedCommand, safeArgs, result, Date.now() - startedAt);
      return parseJsonOutput(result, safeArgs);
    } catch (error) {
      logWpCliError(normalizedCommand, safeArgs, error, Date.now() - startedAt);
      throw error;
    }
  },
});

export const wpCliTool = createWpCliTool(async () => {
  throw new Error('wp-cli executor not configured');
});

const formatLogDetails = (details: Record<string, unknown>) => JSON.stringify(details);

const logWpCliStart = (command: string, args: string[]) => {
  console.info(
    `[wp-cli] start ${formatLogDetails({ command, args, timestamp: new Date().toISOString() })}`,
  );
};

const logWpCliResult = (
  command: string,
  args: string[],
  result: WpCliResult,
  durationMs: number,
) => {
  console.info(
    `[wp-cli] complete ${formatLogDetails({
      command,
      args,
      exitCode: result.exitCode,
      durationMs,
      stdoutBytes: result.stdout.length,
      stderrBytes: result.stderr.length,
      timestamp: new Date().toISOString(),
    })}`,
  );
};

const logWpCliError = (command: string, args: string[], error: unknown, durationMs: number) => {
  console.error(
    `[wp-cli] error ${formatLogDetails({
      command,
      args,
      durationMs,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    })}`,
  );
};

export const createWpCliHelpers = (executor: WpCliExecutor) => {
  const run = (command: string, args?: string[]) => executor({ command, args });

  const ensureInstalled = async () => {
    const res = await run('wp core version', ['--skip-plugins', '--skip-themes']);
    return res.exitCode === 0;
  };

  const ensureDatabase = async () => {
    const res = await run('wp db check', ['--skip-plugins', '--skip-themes']);
    return res.exitCode === 0;
  };

  const activatePlugin = async (slug: string) => {
    const list = await run('wp plugin list', ['--format=json']);
    const existing = Array.isArray(list.json)
      ? list.json.find((plugin) => plugin?.name === slug && plugin?.status === 'active')
      : null;
    if (existing) return list;
    return run('wp plugin activate', [slug]);
  };

  return {
    run,
    ensureInstalled,
    ensureDatabase,
    activatePlugin,
  };
};
