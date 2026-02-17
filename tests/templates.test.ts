import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildTemplateVariables,
  substituteTemplateVariables,
} from '../src/templates/substitution.js';

test('template substitution replaces known variables', () => {
  const variables = buildTemplateVariables({
    prompt: 'Test',
    siteId: 'demo',
    themeMode: 'parent',
    business: { name: 'Acme Studio', tagline: 'Move well' },
  });
  const { content, missing } = substituteTemplateVariables('Welcome to [BUSINESS_NAME]', variables);
  assert.equal(content, 'Welcome to Acme Studio');
  assert.equal(missing.length, 0);
});
