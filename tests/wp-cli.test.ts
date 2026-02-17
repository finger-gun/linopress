import assert from 'node:assert/strict';
import test from 'node:test';
import { createWpCliTool, validateWpCliCommand } from '../src/tools/wp-cli.js';

test('validateWpCliCommand allows allowlisted commands', () => {
  assert.doesNotThrow(() => validateWpCliCommand('wp core version'));
});

test('validateWpCliCommand rejects non-allowlisted commands', () => {
  assert.throws(() => validateWpCliCommand('wp eval-file hack.php'));
});

test('wp-cli tool rejects unsafe args', async () => {
  const tool = createWpCliTool(async () => ({ stdout: '', stderr: '', exitCode: 0 }));
  await assert.rejects(
    () => tool.handler({ command: 'wp core version', args: [';rm -rf /'] }, undefined as never),
    /disallowed shell characters/,
  );
});
