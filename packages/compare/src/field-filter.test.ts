import { describe, expect, test } from 'vitest';
import { filterDiffs } from './field-filter.js';

describe('filterDiffs', () => {
  test('filters exact path matches', () => {
    expect(filterDiffs([{ kind: 'changed', path: 'og:title', before: 'a', after: 'b' }], ['og:title'])).toEqual([]);
  });

  test('filters array children for matching prefix', () => {
    expect(filterDiffs([{ kind: 'added', path: 'og:image[0]', after: 'a' }], ['og:image'])).toEqual([]);
  });

  test('does not false-match og flat keys', () => {
    expect(filterDiffs([{ kind: 'changed', path: 'og:image:width', before: '1', after: '2' }], ['og:image'])).toEqual([
      { kind: 'changed', path: 'og:image:width', before: '1', after: '2' },
    ]);
  });

  test('filters nested object prefixes', () => {
    expect(
      filterDiffs([{ kind: 'removed', path: 'groups[0].disallow[1]', before: '/private' }], ['groups[0]']),
    ).toEqual([]);
  });
});
