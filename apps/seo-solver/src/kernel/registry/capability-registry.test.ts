import { createCapabilityRegistry } from '#kernel';
import { expect, test } from '#test-support/test-runtime';

test('creates empty capability registries for fetchers, extractors, and renderers', () => {
  const registry = createCapabilityRegistry();

  expect(registry.fetchers.size).toBe(0);
  expect(registry.extractors.size).toBe(0);
  expect(registry.renderers.size).toBe(0);
});
