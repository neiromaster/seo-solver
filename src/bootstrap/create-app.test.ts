import { expect, test } from 'bun:test';
import { createV2App } from './create-app';

test('createV2App registers the phase two baseline capabilities', () => {
  const app = createV2App();

  expect(app.registry.fetchers.has('basic')).toBe(true);
  expect(app.registry.fetchers.has('browser')).toBe(true);
  expect(app.registry.extractors.has('jsonld')).toBe(true);
  expect(app.registry.renderers.has('editor-diff')).toBe(true);
  expect(app.registry.renderers.has('json')).toBe(true);
  expect(app.registry.renderers.has('terminal')).toBe(true);
});
