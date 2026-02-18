import { spawn } from 'node:child_process';
import { access, readFile, readdir } from 'node:fs/promises';
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

export const listStacks = async (): Promise<string[]> => {
  let entries: Array<import('node:fs').Dirent> = [];
  try {
    entries = (await readdir(STACKS_DIR, { withFileTypes: true })) as unknown as Array<
      import('node:fs').Dirent
    >;
  } catch {
    return [];
  }

  const stacks: string[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const siteId = entry.name;
    try {
      await assertStackExists(siteId);
      stacks.push(siteId);
    } catch {
      // ignore non-stack directories
    }
  }
  return stacks;
};

export const readStackEnv = async (siteId: string) => {
  const { envPath } = getStackPaths(siteId);
  const raw = await readFile(envPath, 'utf8');
  const env: Record<string, string> = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (key) env[key] = value;
  }
  return env;
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
