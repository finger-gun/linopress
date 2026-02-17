#!/usr/bin/env node

import { provisionStack } from './stack/provision.js';
import { destroyStack, startStack, stopStack } from './stack/lifecycle.js';

type ParsedArgs = {
  siteId?: string;
  port?: number;
  browser?: boolean;
  help?: boolean;
};

const printUsage = () => {
  console.log(
    `\nLinopress CLI\n\nUsage:\n  linopress provision <site-id> [--port 8080] [--browser]\n  linopress start <site-id>\n  linopress stop <site-id>\n  linopress destroy <site-id>\n`,
  );
};

const parseArgs = (args: string[]): { command?: string; parsed: ParsedArgs } => {
  const [command, ...rest] = args;
  const parsed: ParsedArgs = {};
  const positional: string[] = [];

  for (let i = 0; i < rest.length; i += 1) {
    const value = rest[i];

    if (value === '--help' || value === '-h') {
      parsed.help = true;
      continue;
    }

    if (value === '--browser') {
      parsed.browser = true;
      continue;
    }

    if (value === '--port') {
      const portValue = rest[i + 1];
      i += 1;
      parsed.port = portValue ? Number(portValue) : undefined;
      continue;
    }

    if (value === '--site') {
      const siteValue = rest[i + 1];
      i += 1;
      parsed.siteId = siteValue;
      continue;
    }

    positional.push(value);
  }

  if (!parsed.siteId && positional.length > 0) {
    parsed.siteId = positional[0];
  }

  return { command, parsed };
};

const main = async () => {
  const { command, parsed } = parseArgs(process.argv.slice(2));

  if (!command || parsed.help) {
    printUsage();
    process.exit(command ? 0 : 1);
  }

  if (!parsed.siteId) {
    console.error('Missing site id. Provide a site id (e.g. linopress provision yoga-studio).');
    process.exit(1);
  }

  const siteId = parsed.siteId;

  if (command === 'provision') {
    const result = await provisionStack({
      siteId,
      port: parsed.port,
      browser: parsed.browser ?? false,
    });

    console.log(`\nProvisioned stack: ${result.siteId}`);
    console.log(`Compose project: ${result.projectName}`);
    console.log(`Stack directory: ${result.siteDir}`);
    console.log(`Port: ${result.port}`);
    return;
  }

  if (command === 'start') {
    await startStack(siteId);
    console.log(`\nStarted stack: ${siteId}`);
    return;
  }

  if (command === 'stop') {
    await stopStack(siteId);
    console.log(`\nStopped stack: ${siteId}`);
    return;
  }

  if (command === 'destroy') {
    await destroyStack(siteId);
    console.log(`\nDestroyed stack: ${siteId}`);
    return;
  }

  console.error(`Unknown command: ${command}`);
  printUsage();
  process.exit(1);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
