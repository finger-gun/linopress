import assert from 'node:assert/strict';
import test from 'node:test';
import { createFileTool } from '../src/tools/file-tool.js';

test('file tool writes and reads within temp root', async () => {
  const tool = createFileTool();
  const target = '/tmp/linopress/linopress-test.txt';
  await tool.handler({ operation: 'write', path: target, data: 'hello' }, undefined as never);
  const result = (await tool.handler({ operation: 'read', path: target }, undefined as never)) as {
    data?: string;
  };
  assert.equal(result.data, 'hello');
  await tool.handler({ operation: 'delete', path: target }, undefined as never);
});

test('file tool rejects disallowed paths', async () => {
  const tool = createFileTool();
  await assert.rejects(
    () => tool.handler({ operation: 'write', path: '/etc/passwd', data: 'x' }, undefined as never),
    /not allowed/,
  );
});
