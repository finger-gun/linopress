import assert from 'node:assert/strict';
import test from 'node:test';
import { validateBuildReport } from '../src/models/schemas.js';

test('BuildReport validation accepts complete report', () => {
  const report = validateBuildReport({
    siteId: 'demo',
    status: 'success',
    steps: [
      {
        id: 'install',
        label: 'Install WordPress',
        status: 'success',
        startedAt: 't1',
        finishedAt: 't2',
      },
    ],
    validation: {
      cli: { databaseOk: true, filesystemOk: true, healthCheckOk: true },
      browser: {
        pagesLoaded: ['http://localhost:8080'],
        consoleErrors: [],
        screenshotsCaptured: 0,
      },
    },
    screenshots: [],
    metadata: {
      startTime: 't1',
      endTime: 't2',
      duration: 1,
      wpVersion: '6.4.2',
      themeGenerated: 'Demo',
      pluginsInstalled: [],
    },
  });
  assert.equal(report.siteId, 'demo');
});
