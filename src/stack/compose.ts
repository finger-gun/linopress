import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import path from 'node:path';

export const STACKS_DIR = path.resolve(process.cwd(), '.linopress', 'stacks');

export const getStackPaths = (siteId: string) => {
  const siteDir = path.join(STACKS_DIR, siteId);
  return {
    siteDir,
    composePath: path.join(siteDir, 'docker-compose.yml'),
    envPath: path.join(siteDir, '.env'),
    projectName: `linopress_${siteId}`,
  };
};

export const assertStackExists = async (siteId: string) => {
  const { composePath, envPath } = getStackPaths(siteId);
  await access(composePath);
  await access(envPath);
};

export const runDockerCompose = (args: string[]) =>
  new Promise<void>((resolve, reject) => {
    const child = spawn('docker', args, { stdio: 'inherit' });

    child.on('error', reject);
    child.on('exit', (code: number | null) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`docker compose failed with exit code ${code}`));
      }
    });
  });
