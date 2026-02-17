import type { Tool } from '@sisu-ai/core';
import { z } from 'zod';

export const WP_CLI_ALLOWLIST = [
  'wp core install',
  'wp core version',
  'wp plugin install',
  'wp plugin activate',
  'wp plugin list',
  'wp theme install',
  'wp theme activate',
  'wp theme list',
  'wp post create',
  'wp post list',
  'wp menu create',
  'wp menu item add-*',
  'wp option get',
  'wp option update',
  'wp db export',
  'wp db check',
  'wp doctor check',
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

const sanitizeArgs = (args?: string[]) => {
  if (!args || args.length === 0) return [];

  return args.map((arg) => {
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
    const safeArgs = sanitizeArgs(args);
    logWpCliStart(command, safeArgs);

    try {
      validateWpCliCommand(command);
      const result = await executor({ command, args: safeArgs });
      logWpCliResult(command, safeArgs, result, Date.now() - startedAt);
      return parseJsonOutput(result, safeArgs);
    } catch (error) {
      logWpCliError(command, safeArgs, error, Date.now() - startedAt);
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
