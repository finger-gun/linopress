import { spawn } from 'node:child_process';
import { createWriteStream, promises as fs } from 'node:fs';
import path from 'node:path';
import { assertStackExists } from '../stack/compose.js';
import type { BuildReport, ThemeMode } from '../models/types.js';
import { validateManifest } from '../models/schemas.js';
import { runCommand } from './docker.js';
import { createWpCliExecutor } from './wp-cli-exec.js';
import {
  buildManifest,
  type ExportExecutor,
  type ExportToolInput,
  type ExportToolResult,
  type ExportWarning,
} from './export-tool.js';

const DEFAULT_EXPORT_DIR = './exports';
const DEFAULT_MAX_SIZE_MB = 500;
const DEFAULT_TIMEOUT_MS = 120_000;

const resolveContainerName = (siteId: string) => `linopress_${siteId}-wordpress-1`;

const safeTimestamp = () => new Date().toISOString().replace(/[:.]/g, '-');

const ensureDir = async (dirPath: string) => {
  await fs.mkdir(dirPath, { recursive: true });
};

const runCommandToFile = (command: string, args: string[], filePath: string, timeoutMs: number) =>
  new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const output = createWriteStream(filePath);
    let stderr = '';

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`Command timed out: ${command} ${args.join(' ')}`));
    }, timeoutMs);

    child.stdout.pipe(output);
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on('exit', (code) => {
      clearTimeout(timer);
      output.end();
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(stderr.trim() || `Command failed with exit code ${code}`));
      }
    });
  });

const archiveWpContent = async (siteId: string, outputPath: string) => {
  const args = [
    'exec',
    resolveContainerName(siteId),
    'tar',
    '-czf',
    '-',
    '--exclude=./cache',
    '--exclude=./upgrade',
    '--exclude=./.cache',
    '--exclude=./uploads/cache',
    '-C',
    '/var/www/html/wp-content',
    '.',
  ];
  await runCommandToFile('docker', args, outputPath, DEFAULT_TIMEOUT_MS);
};

const exportDatabase = async (siteId: string, outputPath: string) => {
  const args = [
    'exec',
    resolveContainerName(siteId),
    'wp',
    'db',
    'export',
    '-',
    '--skip-plugins',
    '--skip-themes',
  ];
  await runCommandToFile('docker', args, outputPath, DEFAULT_TIMEOUT_MS);
};

const getWordPressVersion = async (siteId: string) => {
  const executor = createWpCliExecutor({ siteId, timeoutMs: DEFAULT_TIMEOUT_MS });
  const result = await executor({
    command: 'wp core version',
    args: ['--skip-plugins', '--skip-themes'],
  });
  return result.stdout.trim();
};

const getPhpVersion = async (siteId: string) => {
  const args = ['exec', resolveContainerName(siteId), 'php', '-r', 'echo PHP_VERSION;'];
  const result = await runCommand('docker', args, DEFAULT_TIMEOUT_MS);
  return result.stdout.trim();
};

const getActiveTheme = async (
  siteId: string,
): Promise<{ name: string; parent?: string; mode: ThemeMode }> => {
  const executor = createWpCliExecutor({ siteId, timeoutMs: DEFAULT_TIMEOUT_MS });
  const result = await executor({
    command: 'wp theme list',
    args: ['--status=active', '--format=json'],
  });

  try {
    const themes = JSON.parse(result.stdout.trim()) as Array<Record<string, string>>;
    const active = themes[0];
    if (active) {
      const parent = active.parent || undefined;
      return {
        name: active.name || active.title || active.slug || 'active-theme',
        parent,
        mode: 'parent',
      };
    }
  } catch {
    // fall through
  }

  return { name: 'unknown-theme', mode: 'parent' };
};

const listPlugins = async (siteId: string) => {
  const executor = createWpCliExecutor({ siteId, timeoutMs: DEFAULT_TIMEOUT_MS });
  const result = await executor({ command: 'wp plugin list', args: ['--format=json'] });
  try {
    const plugins = JSON.parse(result.stdout.trim()) as Array<Record<string, string>>;
    return plugins.map((plugin) => `${plugin.name}@${plugin.version}`);
  } catch {
    return [];
  }
};

const validateSqlDump = async (sqlPath: string) => {
  const data = await fs.readFile(sqlPath, 'utf8');
  const hasCreate = /CREATE TABLE/i.test(data);
  const hasInsert = /INSERT INTO/i.test(data);
  return hasCreate && hasInsert;
};

const scanForSecrets = async (sqlPath: string): Promise<ExportWarning[]> => {
  const data = await fs.readFile(sqlPath, 'utf8');
  const patterns = [
    { regex: /sk_live_[0-9a-zA-Z]{16,}/g, message: 'Potential Stripe secret key found.' },
    { regex: /AKIA[0-9A-Z]{16}/g, message: 'Potential AWS access key found.' },
    {
      regex: /(password|passwd|pwd)\s*[:=]\s*['"][^'\"]{8,}/gi,
      message: 'Potential plaintext password found.',
    },
    { regex: /api[_-]?key\s*[:=]\s*['"][^'\"]{8,}/gi, message: 'Potential API key found.' },
  ];

  const warnings: ExportWarning[] = [];
  for (const pattern of patterns) {
    if (pattern.regex.test(data)) {
      warnings.push({ type: 'secret', message: pattern.message });
    }
  }
  return warnings;
};

const validateBundleContents = async (bundlePath: string) => {
  const result = await runCommand('tar', ['-tzf', bundlePath], DEFAULT_TIMEOUT_MS);
  if (result.exitCode !== 0) {
    throw new Error(result.stderr || 'Failed to validate bundle archive');
  }

  const contents = result.stdout.split('\n');
  const hasWpContent = contents.some((entry) => entry.startsWith('wp-content/'));
  const hasDatabase = contents.some((entry) => entry === 'database.sql');
  const hasManifest = contents.some((entry) => entry === 'manifest.json');
  return hasWpContent && hasDatabase && hasManifest;
};

const copyScreenshots = async (paths: string[], destinationDir: string) => {
  await ensureDir(destinationDir);
  await Promise.all(
    paths.map(async (item) => {
      const base = path.basename(item);
      await fs.copyFile(item, path.join(destinationDir, base));
    }),
  );
};

export const createExportExecutor = (): ExportExecutor => async (input: ExportToolInput) => {
  const startedAt = Date.now();
  const warnings: ExportWarning[] = [];
  const siteId = input.siteId;
  await assertStackExists(siteId);

  const exportDir = input.outputDir ?? process.env.EXPORT_DIR ?? DEFAULT_EXPORT_DIR;
  const siteExportDir = path.resolve(exportDir, siteId);
  await ensureDir(siteExportDir);

  const timestamp = safeTimestamp();
  const bundleName = `site-${siteId}_${timestamp}.tar.gz`;
  const bundlePath = path.join(siteExportDir, bundleName);
  const tempDir = path.join(siteExportDir, `.tmp-export-${timestamp}`);
  const tempBundlePath = `${bundlePath}.tmp`;

  await ensureDir(tempDir);

  try {
    const wpContentArchive = path.join(tempDir, 'wp-content.tar.gz');
    const databaseSql = path.join(tempDir, 'database.sql');
    const manifestPath = path.join(tempDir, 'manifest.json');
    const bundleWorkDir = path.join(tempDir, 'bundle');
    await ensureDir(bundleWorkDir);

    await archiveWpContent(siteId, wpContentArchive);
    await exportDatabase(siteId, databaseSql);

    const sqlValid = await validateSqlDump(databaseSql);
    if (!sqlValid) {
      warnings.push({
        type: 'validation',
        message: 'Database dump did not include expected SQL statements.',
      });
    }

    warnings.push(...(await scanForSecrets(databaseSql)));

    const wordpressVersion = await getWordPressVersion(siteId);
    const phpVersion = await getPhpVersion(siteId);
    const plugins = input.plugins ?? (await listPlugins(siteId));
    const theme = input.theme ?? (await getActiveTheme(siteId));

    const manifest = buildManifest({
      siteId,
      wordpressVersion,
      phpVersion,
      plugins,
      theme,
      buildReport: input.buildReport as BuildReport,
    });

    validateManifest(manifest);
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

    const wpContentDir = path.join(bundleWorkDir, 'wp-content');
    await ensureDir(wpContentDir);
    const extractResult = await runCommand(
      'tar',
      ['-xzf', wpContentArchive, '-C', wpContentDir],
      DEFAULT_TIMEOUT_MS,
    );
    if (extractResult.exitCode !== 0) {
      throw new Error(extractResult.stderr || 'Failed to extract wp-content archive');
    }

    await fs.copyFile(databaseSql, path.join(bundleWorkDir, 'database.sql'));
    await fs.copyFile(manifestPath, path.join(bundleWorkDir, 'manifest.json'));

    if (input.includeScreenshots && input.screenshotPaths?.length) {
      await copyScreenshots(input.screenshotPaths, path.join(bundleWorkDir, 'screenshots'));
    }

    const tarArgs = ['-czf', tempBundlePath, '-C', bundleWorkDir, '.'];
    const tarResult = await runCommand('tar', tarArgs, DEFAULT_TIMEOUT_MS);
    if (tarResult.exitCode !== 0) {
      throw new Error(tarResult.stderr || 'Failed to create export bundle');
    }

    const bundleValid = await validateBundleContents(tempBundlePath);
    if (!bundleValid) {
      throw new Error('Export bundle missing required contents');
    }

    await fs.rename(tempBundlePath, bundlePath);

    const stats = await fs.stat(bundlePath);
    const sizeBytes = stats.size;
    const maxSizeMb = input.maxSizeMb ?? DEFAULT_MAX_SIZE_MB;
    if (sizeBytes > maxSizeMb * 1024 * 1024) {
      warnings.push({
        type: 'size',
        message: `Export bundle size ${(sizeBytes / 1024 / 1024).toFixed(2)}MB exceeds ${maxSizeMb}MB.`,
      });
    }

    const durationMs = Date.now() - startedAt;

    return {
      status: 'success',
      bundlePath,
      sizeBytes,
      manifest,
      warnings,
      exportDurationMs: durationMs,
    };
  } catch (error) {
    return {
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
      warnings,
      exportDurationMs: Date.now() - startedAt,
      tempDir,
    };
  } finally {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }
};
