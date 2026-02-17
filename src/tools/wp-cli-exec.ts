import { runCommand } from './docker.js';
import type { WpCliExecutor } from './wp-cli.js';

export type WpCliExecOptions = {
  siteId: string;
  timeoutMs?: number;
  user?: string;
};

const resolveContainerName = (siteId: string) => `linopress_${siteId}-wordpress-1`;

export const createWpCliExecutor = ({ siteId, timeoutMs, user = 'www-data' }: WpCliExecOptions): WpCliExecutor =>
  async ({ command, args }) => {
    const cmdArgs = [
      'exec',
      '-u',
      user,
      resolveContainerName(siteId),
      ...command.split(' '),
      ...(args ?? []),
    ];

    return runCommand('docker', cmdArgs, timeoutMs);
  };

export const isWordPressInstalled = async (executor: WpCliExecutor) => {
  const result = await executor({
    command: 'wp core version',
    args: ['--skip-plugins', '--skip-themes'],
  });

  return result.exitCode === 0;
};

export const isDatabaseReady = async (executor: WpCliExecutor) => {
  const result = await executor({
    command: 'wp db check',
    args: ['--skip-plugins', '--skip-themes'],
  });

  return result.exitCode === 0;
};
