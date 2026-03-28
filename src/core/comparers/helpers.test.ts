import { describe, expect, test } from 'bun:test';
import type { Schema } from '#types';
import { compareFlat, groupByType } from './helpers';

describe('compareFlat', () => {
  test('returns empty results for two empty objects', () => {
    const result = compareFlat({}, {});
    expect(result.diffs).toEqual([]);
    expect(result.added).toEqual([]);
    expect(result.removed).toEqual([]);
  });

  test('returns empty results for identical objects', () => {
    const result = compareFlat({ a: '1', b: '2' }, { a: '1', b: '2' });
    expect(result.diffs).toEqual([]);
    expect(result.added).toEqual([]);
    expect(result.removed).toEqual([]);
  });

  test('detects keys only in b as added', () => {
    const result = compareFlat({ a: '1' }, { a: '1', b: '2', c: '3' });
    expect(result.added).toEqual(['b', 'c']);
    expect(result.diffs).toEqual([]);
    expect(result.removed).toEqual([]);
  });

  test('detects keys only in a as removed', () => {
    const result = compareFlat({ a: '1', b: '2' }, { a: '1' });
    expect(result.removed).toEqual(['b']);
    expect(result.diffs).toEqual([]);
    expect(result.added).toEqual([]);
  });

  test('detects changed values', () => {
    const result = compareFlat({ a: '1' }, { a: '2' });
    expect(result.diffs).toEqual([{ key: 'a', a: '1', b: '2' }]);
    expect(result.added).toEqual([]);
    expect(result.removed).toEqual([]);
  });

  test('handles mixed added removed and changed', () => {
    const result = compareFlat({ a: '1', b: '2', c: '3' }, { a: '1', b: 'changed', d: '4' });
    expect(result.diffs).toEqual([{ key: 'b', a: '2', b: 'changed' }]);
    expect(result.removed).toEqual(['c']);
    expect(result.added).toEqual(['d']);
  });

  test('treats same empty string values as equal', () => {
    const result = compareFlat({ a: '' }, { a: '' });
    expect(result.diffs).toEqual([]);
  });

  test('detects empty string vs non-empty as diff', () => {
    const result = compareFlat({ a: '' }, { a: 'value' });
    expect(result.diffs).toEqual([{ key: 'a', a: '', b: 'value' }]);
  });

  test('handles a single empty vs non-empty side', () => {
    const result = compareFlat({}, { x: 'y' });
    expect(result.added).toEqual(['x']);
    expect(result.removed).toEqual([]);
    expect(result.diffs).toEqual([]);
  });

  test('handles multiple diffs at once', () => {
    const result = compareFlat({ a: '1', b: '2' }, { a: '10', b: '20' });
    expect(result.diffs).toEqual([
      { key: 'a', a: '1', b: '10' },
      { key: 'b', a: '2', b: '20' },
    ]);
  });
});

describe('groupByType', () => {
  test('returns empty Map for empty array', () => {
    const result = groupByType([]);
    expect(result.size).toBe(0);
  });

  test('groups schemas by @type string', () => {
    const schemas: Schema[] = [
      { '@type': 'Article', name: 'A1' },
      { '@type': 'Product', name: 'P1' },
      { '@type': 'Article', name: 'A2' },
    ];
    const result = groupByType(schemas);
    expect(result.size).toBe(2);
    expect(result.get('Article')!.length).toBe(2);
    expect(result.get('Product')!.length).toBe(1);
  });

  test("groups schemas without @type under '__NO_TYPE__' key", () => {
    const schemas: Schema[] = [{ name: 'NoType1' }, { '@type': 'Article', name: 'A' }, { name: 'NoType2' }];
    const result = groupByType(schemas);
    expect(result.get('__NO_TYPE__')!.length).toBe(2);
    expect(result.get('Article')!.length).toBe(1);
  });

  test('handles single schema', () => {
    const result = groupByType([{ '@type': 'Thing', name: 'T' }]);
    expect(result.size).toBe(1);
    expect(result.get('Thing')!.length).toBe(1);
  });

  test('handles all schemas of same type', () => {
    const schemas: Schema[] = [
      { '@type': 'Article', name: 'A1' },
      { '@type': 'Article', name: 'A2' },
      { '@type': 'Article', name: 'A3' },
    ];
    const result = groupByType(schemas);
    expect(result.size).toBe(1);
    expect(result.get('Article')!.length).toBe(3);
  });

  test('coerces non-string @type values via String()', () => {
    const schemas: Schema[] = [{ '@type': 42, name: 'N' }];
    const result = groupByType(schemas);
    expect(result.get('42')!.length).toBe(1);
  });

  test('uses first element of array @type (JSON-LD multi-type)', () => {
    const schemas: Schema[] = [{ '@type': ['Article', 'BlogPosting'], name: 'N' }];
    const result = groupByType(schemas);
    const key = [...result.keys()][0];
    expect(key).toBe('Article');
  });

  test('preserves schema objects in groups', () => {
    const s1: Schema = { '@type': 'Article', name: 'Test' };
    const s2: Schema = { '@type': 'Article', title: 'Title' };
    const result = groupByType([s1, s2]);
    const group = result.get('Article')!;
    expect(group[0]).toBe(s1);
    expect(group[1]).toBe(s2);
  });
});
