import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertAllowlistedUrl,
  normalizeCreativeness,
  recordAllowlistViolation,
  resolveControlFlowLoops,
  resolveReviewCycles,
} from '../src/selfimprove/orchestrator.js';
import { selectSiteIdFromStacks } from '../src/cli/site-selection.js';

test('normalizeCreativeness defaults to 4 and clamps to 1-5', () => {
  assert.equal(normalizeCreativeness(undefined), 4);
  assert.equal(normalizeCreativeness(0), 1);
  assert.equal(normalizeCreativeness(1), 1);
  assert.equal(normalizeCreativeness(4.2), 4);
  assert.equal(normalizeCreativeness(5), 5);
  assert.equal(normalizeCreativeness(6), 5);
});

test('selectSiteIdFromStacks auto-selects when only one stack exists', () => {
  const selected = selectSiteIdFromStacks(undefined, ['alpha']);
  assert.equal(selected, 'alpha');
});

test('selectSiteIdFromStacks requires --site when multiple stacks exist', () => {
  assert.throws(
    () => selectSiteIdFromStacks(undefined, ['alpha', 'beta'], { commandLabel: 'selfimprove' }),
    /Provide --site <id> for selfimprove/,
  );
});

test('aggressive mode caps review cycles and control flow loops', () => {
  assert.equal(resolveReviewCycles(1), 2);
  assert.equal(resolveReviewCycles(4), 3);
  assert.equal(resolveReviewCycles(5), 4);
  assert.equal(resolveControlFlowLoops(1), 7);
  assert.equal(resolveControlFlowLoops(5), 10);
});

test('external URL attempts are blocked and reported', () => {
  assert.throws(() => assertAllowlistedUrl('https://example.com'), /not allowlisted/);
  const errors: Array<{ message: string; code?: string }> = [];
  recordAllowlistViolation(errors as never, 'review', 'https://example.com', 'not allowlisted');
  assert.equal(errors[0]?.code, 'browser_url_blocked');
});
