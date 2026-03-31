import { expect, test } from 'bun:test';
import { createCapabilityRegistry } from '#kernel';

test('creates empty capability registries for fetchers, extractors, and renderers', () => {
  const registry = createCapabilityRegistry();

  expect(registry.fetchers.size).toBe(0);
  expect(registry.extractors.size).toBe(0);
  expect(registry.renderers.size).toBe(0);
});
