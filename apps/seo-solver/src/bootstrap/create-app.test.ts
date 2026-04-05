import { expect, test } from '#test-support/test-runtime';
import { createRuntimeApp } from './create-app';

test('createRuntimeApp registers the baseline capabilities', () => {
  const app = createRuntimeApp();

  expect(app.registry.fetchers.has('basic')).toBe(true);
  expect(app.registry.fetchers.has('browser')).toBe(true);
  expect(app.registry.extractors.has('jsonld')).toBe(true);
  expect(app.registry.renderers.has('editor-diff')).toBe(true);
  expect(app.registry.renderers.has('json')).toBe(true);
  expect(app.registry.renderers.has('terminal')).toBe(true);
});
