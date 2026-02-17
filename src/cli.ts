#!/usr/bin/env node

import { provisionStack } from './stack/provision.js';
import { destroyStack, startStack, stopStack } from './stack/lifecycle.js';
import { buildFromInput } from './build/orchestrator.js';

type ParsedArgs = {
  siteId?: string;
  port?: number;
  browser?: boolean;
  prompt?: string;
  specPath?: string;
  baseUrl?: string;
  buildTimeoutMs?: number;
  noBrowser?: boolean;
  noHeal?: boolean;
  noReview?: boolean;
  yolo?: boolean;
  help?: boolean;
  reviewCycles?: number;
  healCycles?: number;
};

const printUsage = () => {
  console.log(
    `\nLinopress CLI\n\nUsage:\n  linopress provision <site-id> [--port 8080] [--browser]\n  linopress start <site-id>\n  linopress stop <site-id>\n  linopress destroy <site-id>\n  linopress build <site-id> [--prompt "..."] [--spec path.json] [--port 8080] [--browser] [--no-browser] [--no-heal] [--no-review] [--yolo] [--timeout ms] [--review-cycles N] [--heal-cycles N]\n`,
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

    if (value === '--no-browser') {
      parsed.noBrowser = true;
      continue;
    }

    if (value === '--no-heal') {
      parsed.noHeal = true;
      continue;
    }

    if (value === '--no-review') {
      parsed.noReview = true;
      continue;
    }

    if (value === '--yolo') {
      parsed.yolo = true;
      continue;
    }

    if (value === '--review-cycles') {
      const cyclesValue = rest[i + 1];
      i += 1;
      parsed.reviewCycles = cyclesValue ? Number(cyclesValue) : undefined;
      continue;
    }

    if (value === '--heal-cycles') {
      const cyclesValue = rest[i + 1];
      i += 1;
      parsed.healCycles = cyclesValue ? Number(cyclesValue) : undefined;
      continue;
    }

    if (value === '--prompt') {
      const promptValue = rest[i + 1];
      i += 1;
      parsed.prompt = promptValue;
      continue;
    }

    if (value === '--spec') {
      const specValue = rest[i + 1];
      i += 1;
      parsed.specPath = specValue;
      continue;
    }

    if (value === '--base-url') {
      const baseUrl = rest[i + 1];
      i += 1;
      parsed.baseUrl = baseUrl;
      continue;
    }

    if (value === '--timeout') {
      const timeoutValue = rest[i + 1];
      i += 1;
      parsed.buildTimeoutMs = timeoutValue ? Number(timeoutValue) : undefined;
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

  if (command === 'build') {
    if (!parsed.prompt && !parsed.specPath) {
      console.error('Build requires --prompt or --spec.');
      process.exit(1);
    }

    const report = await buildFromInput({
      siteId,
      prompt: parsed.prompt,
      specPath: parsed.specPath,
      port: parsed.port,
      baseUrl: parsed.baseUrl,
      enableBrowser: parsed.noBrowser ? false : (parsed.browser ?? false),
      enableHealing: parsed.noHeal ? false : true,
      enableReview: parsed.noReview ? false : undefined,
      yolo: parsed.yolo,
      buildTimeoutMs: parsed.buildTimeoutMs,
      reviewCycles: parsed.reviewCycles,
      healingCycles: parsed.healCycles,
    });

    console.log(`\nBuild status: ${report.status}`);
    console.log(
      `Steps: ${report.steps.filter((step) => step.status === 'success').length}/${report.steps.length} complete`,
    );
    if (report.status !== 'success') {
      const failedSteps = report.steps
        .filter((step) => step.status === 'failed')
        .map((step) => step.id);
      if (failedSteps.length) {
        console.log(`Failed steps: ${failedSteps.join(', ')}`);
      }
      console.log(
        `Validation: db=${report.validation.cli.databaseOk} fs=${report.validation.cli.filesystemOk} health=${report.validation.cli.healthCheckOk} browserErrors=${report.validation.browser.consoleErrors.length}`,
      );
    }
    if (report.errors?.length) {
      console.log('Errors:');
      for (const err of report.errors) {
        console.log(`- ${err.message}`);
      }
    }
    if (report.summary) {
      console.log('\n' + report.summary);
    }
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
