import type { Tool } from '@sisu-ai/core';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { posix as path } from 'node:path';
import { z } from 'zod';
import { runCommand } from './docker.js';

const DEFAULT_ROOT = '/var/www/html/wp-content';
const TEMP_ROOT = '/tmp/linopress';
const ALLOWED_ROOTS = [DEFAULT_ROOT, TEMP_ROOT] as const;

const fileToolSchema = z.object({
  operation: z.enum([
    'read',
    'write',
    'copy',
    'delete',
    'list',
    'stat',
    'exists',
    'temp_create',
    'temp_cleanup',
  ]),
  siteId: z.string().min(1).optional(),
  path: z.string().min(1).optional(),
  source: z.string().min(1).optional(),
  destination: z.string().min(1).optional(),
  data: z.union([z.string(), z.record(z.string(), z.unknown()), z.array(z.unknown())]).optional(),
  encoding: z.enum(['utf8', 'base64']).optional(),
  recursive: z.boolean().optional(),
  pattern: z.string().optional(),
  prefix: z.string().optional(),
  ext: z.string().optional(),
});

export type FileToolInput = z.infer<typeof fileToolSchema>;

type FileToolResult =
  | { status: 'ok' }
  | { status: 'ok'; path: string }
  | { status: 'ok'; exists: boolean }
  | { status: 'ok'; data: string; encoding: 'utf8' | 'base64' }
  | { status: 'ok'; entries: Array<{ path: string; type: 'file' | 'directory' }> }
  | {
      status: 'ok';
      stat: {
        exists: boolean;
        size?: number;
        mtime?: string;
        isFile?: boolean;
        isDirectory?: boolean;
      };
    };

const fileLocks = new Map<string, Promise<void>>();

const withFileLock = async <T>(target: string, action: () => Promise<T>) => {
  const current = fileLocks.get(target) ?? Promise.resolve();
  let release: (() => void) | undefined;
  const next = new Promise<void>((resolve) => {
    release = resolve;
  });
  fileLocks.set(
    target,
    current.then(() => next),
  );
  await current;

  try {
    return await action();
  } finally {
    if (release) {
      release();
    }
    if (fileLocks.get(target) === next) {
      fileLocks.delete(target);
    }
  }
};

const ensureTempRoot = async () => {
  await fs.mkdir(TEMP_ROOT, { recursive: true, mode: 0o755 });
  await fs.chmod(TEMP_ROOT, 0o755);
};

const normalizePath = (input: string) => {
  const raw = input.startsWith('/') ? input : path.join(DEFAULT_ROOT, input);
  return path.normalize(raw);
};

const isWithinRoot = (target: string, root: string) => {
  const relative = path.relative(root, target);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
};

const ensureAllowedPath = (input: string) => {
  const resolved = normalizePath(input);
  const allowed = ALLOWED_ROOTS.some((root) => isWithinRoot(resolved, root));
  if (!allowed) {
    throw new Error(`file-tool path not allowed: ${input}`);
  }
  return resolved;
};

const resolveContainerName = (siteId: string) => `linopress_${siteId}-wordpress-1`;

const resolveRunningWordpressContainer = async (): Promise<string | null> => {
  const result = await runCommand('docker', ['ps', '--format', '{{.Names}}'], 10_000);
  if (result.exitCode !== 0) return null;
  const names = result.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const matches = names.filter((name) => /^linopress_.+-wordpress-1$/.test(name));
  if (matches.length === 1) return matches[0];
  return null;
};

const runDocker = async (args: string[]) => {
  const result = await runCommand('docker', args, 60_000);
  if (result.exitCode !== 0) {
    throw new Error(result.stderr || result.stdout || 'docker command failed');
  }
  return result;
};

const ensureDirPermissions = async (dirPath: string) => {
  await fs.chmod(dirPath, 0o755);
};

const ensureFilePermissions = async (filePath: string) => {
  await fs.chmod(filePath, 0o644);
};

const ensureParentDir = async (targetPath: string) => {
  const dir = path.dirname(targetPath);
  await fs.mkdir(dir, { recursive: true, mode: 0o755 });
  await ensureDirPermissions(dir);
};

const buildPatternMatcher = (pattern?: string) => {
  if (!pattern) return () => true;
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`^${escaped.replace(/\*/g, '.*').replace(/\?/g, '.')}$`);
  return (value: string) => regex.test(value);
};

const listEntries = async (root: string, recursive: boolean, pattern?: string) => {
  const matcher = buildPatternMatcher(pattern);
  const entries: Array<{ path: string; type: 'file' | 'directory' }> = [];

  const walk = async (current: string) => {
    const dirents = await fs.readdir(current, { withFileTypes: true });
    for (const dirent of dirents) {
      const fullPath = path.join(current, dirent.name);
      const relativePath = path.relative(root, fullPath);
      const matches = matcher(relativePath) || matcher(dirent.name);

      if (dirent.isDirectory()) {
        if (matches) {
          entries.push({ path: fullPath, type: 'directory' });
        }
        if (recursive) {
          await walk(fullPath);
        }
      } else if (dirent.isFile()) {
        if (matches) {
          entries.push({ path: fullPath, type: 'file' });
        }
      }
    }
  };

  await walk(root);
  return entries;
};

const readFile = async (
  targetPath: string,
  encoding: 'utf8' | 'base64',
): Promise<FileToolResult> => {
  if (encoding === 'base64') {
    const buffer = await fs.readFile(targetPath);
    return { status: 'ok', data: buffer.toString('base64'), encoding };
  }

  const data = await fs.readFile(targetPath, 'utf8');
  return { status: 'ok', data, encoding };
};

const readFileInContainer = async (
  container: string,
  targetPath: string,
  encoding: 'utf8' | 'base64',
): Promise<FileToolResult> => {
  const result = await runCommand('docker', ['exec', container, 'cat', targetPath], 60_000);
  if (result.exitCode !== 0) {
    throw new Error(result.stderr || result.stdout || 'docker exec cat failed');
  }
  if (encoding === 'base64') {
    return { status: 'ok', data: Buffer.from(result.stdout, 'utf8').toString('base64'), encoding };
  }
  return { status: 'ok', data: result.stdout, encoding };
};

const writeFileAtomic = async (
  targetPath: string,
  data: string,
  encoding: 'utf8' | 'base64',
): Promise<FileToolResult> =>
  withFileLock(targetPath, async () => {
    await ensureParentDir(targetPath);
    const tempPath = `${targetPath}.tmp-${randomUUID()}`;

    try {
      if (encoding === 'base64') {
        await fs.writeFile(tempPath, Buffer.from(data, 'base64'));
      } else {
        await fs.writeFile(tempPath, data, 'utf8');
      }
      await ensureFilePermissions(tempPath);
      await fs.rename(tempPath, targetPath);
      await ensureFilePermissions(targetPath);
    } catch (error) {
      await fs.rm(tempPath, { force: true });
      throw error;
    }

    return { status: 'ok' };
  });

const writeFileInContainer = async (
  container: string,
  targetPath: string,
  data: string,
  encoding: 'utf8' | 'base64',
): Promise<FileToolResult> => {
  await ensureTempRoot();
  const tempPath = path.join(TEMP_ROOT, `linopress-file-${randomUUID()}`);
  if (encoding === 'base64') {
    await fs.writeFile(tempPath, Buffer.from(data, 'base64'));
  } else {
    await fs.writeFile(tempPath, data, 'utf8');
  }

  const dir = path.dirname(targetPath);
  await runDocker(['exec', container, 'mkdir', '-p', dir]);
  await runDocker(['cp', tempPath, `${container}:${targetPath}`]);
  await runDocker(['exec', container, 'chmod', '644', targetPath]);
  await fs.rm(tempPath, { force: true });
  return { status: 'ok' };
};

const copyFileSafe = async (sourcePath: string, destinationPath: string): Promise<FileToolResult> =>
  withFileLock(destinationPath, async () => {
    await ensureParentDir(destinationPath);
    await fs.copyFile(sourcePath, destinationPath);
    await ensureFilePermissions(destinationPath);
    return { status: 'ok' };
  });

const deletePath = async (targetPath: string): Promise<FileToolResult> =>
  withFileLock(targetPath, async () => {
    await fs.rm(targetPath, { recursive: true, force: true });
    return { status: 'ok' };
  });

const statPath = async (targetPath: string): Promise<FileToolResult> => {
  try {
    const stats = await fs.stat(targetPath);
    return {
      status: 'ok',
      stat: {
        exists: true,
        size: stats.size,
        mtime: stats.mtime.toISOString(),
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
      },
    };
  } catch (error) {
    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code?: string }).code === 'ENOENT'
    ) {
      return { status: 'ok', stat: { exists: false } };
    }
    throw error;
  }
};

const existsPath = async (targetPath: string): Promise<FileToolResult> => {
  try {
    await fs.access(targetPath);
    return { status: 'ok', exists: true };
  } catch {
    return { status: 'ok', exists: false };
  }
};

const createTempFile = async (
  data?: string,
  encoding: 'utf8' | 'base64' = 'utf8',
  prefix = 'linopress-',
  ext = '',
): Promise<FileToolResult> => {
  await ensureTempRoot();
  const filename = `${prefix}${randomUUID()}${ext}`;
  const targetPath = path.join(TEMP_ROOT, filename);

  if (data !== undefined) {
    await writeFileAtomic(targetPath, data, encoding);
  } else {
    await fs.writeFile(targetPath, '', 'utf8');
    await ensureFilePermissions(targetPath);
  }

  return { status: 'ok', path: targetPath };
};

const cleanupTempFiles = async (): Promise<FileToolResult> => {
  await ensureTempRoot();
  const entries = await fs.readdir(TEMP_ROOT);
  await Promise.all(
    entries.map((entry) => fs.rm(path.join(TEMP_ROOT, entry), { recursive: true, force: true })),
  );
  return { status: 'ok' };
};

export const createFileTool = (): Tool<FileToolInput> => ({
  name: 'file',
  description: 'Restricted filesystem access for wp-content and temp files.',
  schema: fileToolSchema,
  handler: async (input) => {
    const encoding = input.encoding ?? 'utf8';

    switch (input.operation) {
      case 'read': {
        if (!input.path) throw new Error('read operation requires path');
        const targetPath = ensureAllowedPath(input.path);
        if (isWithinRoot(targetPath, DEFAULT_ROOT)) {
          const siteId = input.siteId || process.env.LINOPRESS_SITE_ID || undefined;
          const container = siteId
            ? resolveContainerName(siteId)
            : await resolveRunningWordpressContainer();
          if (container) {
            return readFileInContainer(container, targetPath, encoding);
          }
        }
        return readFile(targetPath, encoding);
      }
      case 'write': {
        if (!input.path) throw new Error('write operation requires path');
        if (input.data === undefined) throw new Error('write operation requires data');
        const targetPath = ensureAllowedPath(input.path);
        const siteId = input.siteId || process.env.LINOPRESS_SITE_ID || undefined;
        const data =
          typeof input.data === 'string' ? input.data : JSON.stringify(input.data, null, 2);
        if (isWithinRoot(targetPath, DEFAULT_ROOT)) {
          const container = siteId
            ? resolveContainerName(siteId)
            : await resolveRunningWordpressContainer();
          if (container) {
            return writeFileInContainer(container, targetPath, data, encoding);
          }
          try {
            return await writeFileAtomic(targetPath, data, encoding);
          } catch (error) {
            const fallbackContainer = await resolveRunningWordpressContainer();
            if (fallbackContainer) {
              return writeFileInContainer(fallbackContainer, targetPath, data, encoding);
            }
            throw error;
          }
        }
        return writeFileAtomic(targetPath, data, encoding);
      }
      case 'copy': {
        if (!input.source || !input.destination) {
          throw new Error('copy operation requires source and destination');
        }
        const sourcePath = ensureAllowedPath(input.source);
        const destinationPath = ensureAllowedPath(input.destination);
        return copyFileSafe(sourcePath, destinationPath);
      }
      case 'delete': {
        if (!input.path) throw new Error('delete operation requires path');
        const targetPath = ensureAllowedPath(input.path);
        return deletePath(targetPath);
      }
      case 'list': {
        if (!input.path) throw new Error('list operation requires path');
        const targetPath = ensureAllowedPath(input.path);
        const entries = await listEntries(targetPath, Boolean(input.recursive), input.pattern);
        return { status: 'ok', entries };
      }
      case 'stat': {
        if (!input.path) throw new Error('stat operation requires path');
        const targetPath = ensureAllowedPath(input.path);
        return statPath(targetPath);
      }
      case 'exists': {
        if (!input.path) throw new Error('exists operation requires path');
        const targetPath = ensureAllowedPath(input.path);
        return existsPath(targetPath);
      }
      case 'temp_create': {
        const data =
          typeof input.data === 'string'
            ? input.data
            : input.data === undefined
              ? undefined
              : JSON.stringify(input.data, null, 2);
        return createTempFile(data, encoding, input.prefix, input.ext);
      }
      case 'temp_cleanup': {
        return cleanupTempFiles();
      }
      default:
        throw new Error(`Unsupported file operation: ${input.operation}`);
    }
  },
});

export const fileTool = createFileTool();
