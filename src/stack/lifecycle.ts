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
    'down',
    '-v',
  ]);
};
