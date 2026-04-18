import { describe, expect, test } from 'vitest';
import { diff } from './diff.js';

describe('diff', () => {
  test('returns empty array for identical primitives', () => {
    expect(diff('hello', 'hello')).toEqual([]);
  });

  test('returns changed entry for changed primitive', () => {
    expect(diff('hello', 'world')).toEqual([{ kind: 'changed', path: '', before: 'hello', after: 'world' }]);
  });

  test('diffs nested objects', () => {
    expect(diff({ a: { b: 1 } }, { a: { b: 2 } })).toEqual([{ kind: 'changed', path: 'a.b', before: 1, after: 2 }]);
  });

  test('diffs arrays by index by default', () => {
    expect(diff([1], [1, 2])).toEqual([{ kind: 'added', path: '[1]', after: 2 }]);
  });

  test('supports ignoreArrayOrder for primitives', () => {
    expect(diff([1, 2, 3], [3, 1, 2], { ignoreArrayOrder: true })).toEqual([]);
  });

  test('reports added and removed primitive members when ignoreArrayOrder is enabled', () => {
    expect(diff([1, 2], [2, 3], { ignoreArrayOrder: true })).toEqual([
      { kind: 'removed', path: '[0]', before: 1 },
      { kind: 'added', path: '[1]', after: 3 },
    ]);
  });

  test('supports ignoreArrayOrder for object equality', () => {
    expect(diff([{ a: 1 }], [{ a: 1 }], { ignoreArrayOrder: true })).toEqual([]);
  });

  test('supports ignoreArrayOrder changed diffs for object arrays', () => {
    expect(diff([{ id: 1, name: 'A' }], [{ id: 1, name: 'B' }], { ignoreArrayOrder: true })).toEqual([
      { kind: 'changed', path: '[0].name', before: 'A', after: 'B' },
    ]);
  });

  test('supports jsonld root path prefixes', () => {
    expect(diff([{ '@type': 'Thing' }], [{ '@type': 'Article' }], { pathPrefix: '$' })).toEqual([
      { kind: 'changed', path: '$[0].@type', before: 'Thing', after: 'Article' },
    ]);
  });

  test('treats flat og keys as flat keys', () => {
    expect(diff({ 'og:title': 'a' }, { 'og:title': 'b' })).toEqual([
      { kind: 'changed', path: 'og:title', before: 'a', after: 'b' },
    ]);
  });

  test('distinguishes null from missing key', () => {
    expect(diff({ x: null }, {})).toEqual([{ kind: 'removed', path: 'x', before: null }]);
  });

  test('does not treat NaN as equal to null', () => {
    expect(diff(NaN, null)).toEqual([{ kind: 'changed', path: '', before: NaN, after: null }]);
  });

  test('does not treat undefined object fields as missing', () => {
    expect(diff({ x: undefined }, {})).toEqual([{ kind: 'removed', path: 'x', before: undefined }]);
  });
});
