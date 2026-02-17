import { spawn } from 'node:child_process';

export type CommandResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
  errorType?: 'not_found' | 'timeout' | 'exec_error';
};

export const runCommand = (command: string, args: string[], timeoutMs = 60_000) =>
  new Promise<CommandResult>((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolve({ stdout, stderr, exitCode: 124, errorType: 'timeout' });
    }, timeoutMs);

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      resolve({
        stdout,
        stderr: `${stderr}\n${error instanceof Error ? error.message : String(error)}`.trim(),
        exitCode: 127,
        errorType: 'exec_error',
      });
    });

    child.on('exit', (code) => {
      clearTimeout(timer);
      const errorType = code === 127 ? 'not_found' : undefined;
      resolve({ stdout, stderr, exitCode: code ?? 1, errorType });
    });
  });
