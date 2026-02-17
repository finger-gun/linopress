import { promises as fs } from 'node:fs';
import { assertStackExists, getStackPaths, runDockerCompose } from './compose.js';

export const startStack = async (siteId: string) => {
  await assertStackExists(siteId);
  const { composePath, envPath, projectName } = getStackPaths(siteId);

  await runDockerCompose([
    'compose',
    '-f',
    composePath,
    '--env-file',
    envPath,
    '-p',
    projectName,
    'start',
  ]);
};

export const stopStack = async (siteId: string) => {
  await assertStackExists(siteId);
  const { composePath, envPath, projectName } = getStackPaths(siteId);

  await runDockerCompose([
    'compose',
    '-f',
    composePath,
    '--env-file',
    envPath,
    '-p',
    projectName,
    'stop',
  ]);
};

export const destroyStack = async (siteId: string) => {
  const { composePath, envPath, projectName, siteDir } = getStackPaths(siteId);

  // Try with compose file first (more precise), fall back to project-name-only
  // if the stack directory was already deleted.
  let hasComposeFile = true;
  try {
    await assertStackExists(siteId);
  } catch {
    hasComposeFile = false;
  }

  if (hasComposeFile) {
    await runDockerCompose([
      'compose',
      '-f',
      composePath,
      '--env-file',
      envPath,
      '-p',
      projectName,
      'down',
      '-v',
    ]);
  } else {
    // No compose file on disk — tear down by project name alone.
    // This handles orphaned Docker resources from previously deleted stack dirs.
    await runDockerCompose(['compose', '-p', projectName, 'down', '-v']);
  }

  // Remove the stack directory from disk after Docker resources are torn down
  await fs.rm(siteDir, { recursive: true, force: true });
};
