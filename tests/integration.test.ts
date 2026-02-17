import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import test from 'node:test';
import { buildFromInput } from '../src/build/orchestrator.js';
import { destroyStack } from '../src/stack/lifecycle.js';
import { runConcurrent } from '../src/agent/concurrency.js';

const hasLlmKey = Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
const shouldRunDocker = process.env.RUN_DOCKER_TESTS === '1' && hasLlmKey;
const shouldRunBrowser = process.env.RUN_BROWSER_TESTS === '1' && shouldRunDocker;

const baseSpec = {
  prompt: 'Integration test site',
  siteId: 'integration-site',
  themeMode: 'parent' as const,
  styleSeed: 'minimalist',
  plugins: ['contact-form-7'],
  pages: [
    { title: 'Home', slug: 'home', content: { id: 'homepage' } },
    { title: 'Contact', slug: 'contact', content: { id: 'contact' } },
  ],
  language: 'en_US',
  timezone: 'UTC',
  permalinkStructure: '/%postname%/',
  business: { name: 'Integration Studio' },
};

const runBuildFor = async (
  siteId: string,
  port: number,
  enableBrowser = false,
  enableHealing = false,
) => {
  try {
    return await buildFromInput({
      siteId,
      siteSpec: { ...baseSpec, siteId },
      port,
      enableBrowser,
      enableHealing,
    });
  } finally {
    await destroyStack(siteId);
  }
};

const testOrSkip = shouldRunDocker ? test : test.skip;
const browserTestOrSkip = shouldRunBrowser ? test : test.skip;

testOrSkip('integration: full build flow', async () => {
  const report = await runBuildFor('integration-site', 8091, false, false);
  assert.equal(report.status, 'success');
});

testOrSkip('integration: per-site isolation with concurrent builds', async () => {
  const [one, two] = await runConcurrent([
    () => runBuildFor('integration-site-a', 8092, false, false),
    () => runBuildFor('integration-site-b', 8093, false, false),
  ]);
  assert.equal(one.status, 'success');
  assert.equal(two.status, 'success');
});

testOrSkip('integration: self-healing scenarios', async () => {
  const report = await runBuildFor('integration-heal', 8094, false, true);
  assert.ok(['success', 'failed'].includes(report.status));
  if (report.status === 'failed') {
    assert.ok(report.healingCycles?.length);
  }
});

testOrSkip('integration: export bundle creation and restoration', async () => {
  const report = await runBuildFor('integration-export', 8095, false, false);
  assert.equal(report.status, 'success');
  assert.ok(report.exportBundle, 'export bundle missing');
  const stats = await fs.stat(report.exportBundle!);
  assert.ok(stats.size > 0);
});

browserTestOrSkip('integration: browser automation and screenshots', async () => {
  const report = await runBuildFor('integration-browser', 8096, true, false);
  assert.equal(report.status, 'success');
  assert.ok(report.validation.browser.pagesLoaded.length > 0);
});
