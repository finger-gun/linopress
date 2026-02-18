import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { runDockerCompose, STACKS_DIR } from './compose.js';

export interface ProvisionOptions {
  siteId: string;
  port?: number;
  browser?: boolean;
}

const COMPOSE_TEMPLATE = path.resolve(process.cwd(), 'docker', 'docker-compose.yml');
const NGINX_TEMPLATE = path.resolve(process.cwd(), 'docker', 'nginx.conf');

const SITE_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

export const assertSiteId = (siteId: string) => {
  if (!SITE_ID_PATTERN.test(siteId)) {
    throw new Error(
      'Invalid siteId. Use only letters, numbers, dashes, or underscores (e.g. yoga-studio-01).',
    );
  }
};

const toDbName = (siteId: string) => `linopress_${siteId}`;
const toDbUser = (siteId: string) => `wp_${siteId}`;

const envFileContents = (siteId: string, port?: number) => {
  const stackPort = port ?? 8080;
  const homeUrl = `http://localhost:${stackPort}`;
  const linopressRoot = process.cwd();

  return [
    `LINOPRESS_ROOT=${linopressRoot}`,
    `WP_STACK_PORT=${stackPort}`,
    `WP_DB_NAME=${toDbName(siteId)}`,
    `WP_DB_USER=${toDbUser(siteId)}`,
    `WP_DB_PASSWORD=${toDbName(siteId)}`,
    `DB_ROOT_PASSWORD=linopress-root`,
    `WP_TABLE_PREFIX=wp_`,
    `WP_HOME=${homeUrl}`,
    `WP_SITEURL=${homeUrl}`,
    `BROWSER_PORT=3000`,
    '',
  ].join('\n');
};

export const provisionStack = async ({ siteId, port, browser = false }: ProvisionOptions) => {
  assertSiteId(siteId);

  const siteDir = path.join(STACKS_DIR, siteId);
  const composePath = path.join(siteDir, 'docker-compose.yml');
  const envPath = path.join(siteDir, '.env');
  const projectName = `linopress_${siteId}`;

  await mkdir(siteDir, { recursive: true });
  await copyFile(COMPOSE_TEMPLATE, composePath);
  await copyFile(NGINX_TEMPLATE, path.join(siteDir, 'nginx.conf'));
  await writeFile(envPath, envFileContents(siteId, port), 'utf8');

  const args = ['compose', '-f', composePath, '--env-file', envPath, '-p', projectName];

  if (browser) {
    args.push('--profile', 'browser');
  }

  args.push('up', '-d', '--build');

  await runDockerCompose(args);

  return { siteId, siteDir, projectName, port: port ?? 8080 };
};
