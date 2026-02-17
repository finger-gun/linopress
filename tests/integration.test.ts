import test from 'node:test';

test.skip('integration: full build flow (requires Docker)', async () => {
  // Requires running Docker and WordPress images. Set RUN_DOCKER_TESTS=1 to enable in the future.
});

test.skip('integration: per-site isolation with concurrent builds', async () => {
  // TODO: implement after build orchestration stabilizes.
});

test.skip('integration: self-healing scenarios', async () => {
  // TODO: implement with seeded failure fixtures.
});

test.skip('integration: export bundle creation and restoration', async () => {
  // TODO: implement export + restore validation.
});

test.skip('integration: browser automation and screenshots', async () => {
  // TODO: requires agent-browser runtime.
});
