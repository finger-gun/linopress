import assert from 'node:assert/strict';
import test from 'node:test';
import { buildManifest } from '../src/tools/export-tool.js';

test('buildManifest returns required fields', () => {
  const manifest = buildManifest({
    siteId: 'demo',
    wordpressVersion: '6.4.2',
    phpVersion: '8.2',
    plugins: ['contact-form-7@1.0'],
    theme: { name: 'Demo', mode: 'parent' },
    buildReport: {
      siteId: 'demo',
      status: 'success',
      mode: 'build',
      steps: [],
      validation: {
        cli: { databaseOk: true, filesystemOk: true, healthCheckOk: true },
        browser: { pagesLoaded: [], consoleErrors: [], screenshotsCaptured: 0 },
      },
      screenshots: [],
      metadata: {
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        duration: 0,
        wpVersion: '6.4.2',
        themeGenerated: 'Demo',
        pluginsInstalled: [],
      },
    },
  });

  assert.equal(manifest.siteId, 'demo');
  assert.equal(manifest.theme.name, 'Demo');
  assert.equal(manifest.plugins.length, 1);
});
