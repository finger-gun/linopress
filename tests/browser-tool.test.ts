import assert from 'node:assert/strict';
import test from 'node:test';
import { createBrowserTool } from '../src/tools/browser-tool.js';

test('browser tool rejects non-allowlisted URLs', async () => {
  const tool = createBrowserTool(async () => ({ status: 'ok' }));
  await assert.rejects(
    () =>
      tool.handler(
        { operation: 'navigate', sessionId: 's1', url: 'https://example.com' },
        undefined as never,
      ),
    /not allowlisted/,
  );
});
