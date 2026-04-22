import { describe, expect, test } from 'vitest';
import { compareObjects } from './core/compare-objects.js';

describe('compareObjects', () => {
  test('returns filtered diff entries for arbitrary objects', () => {
    const result = compareObjects(
      {
        title: 'Before',
        meta: {
          description: 'Old description',
          image: 'before.png',
        },
      },
      {
        title: 'After',
        meta: {
          description: 'New description',
          image: 'after.png',
        },
      },
      { ignoreFields: ['meta.image'] },
    );

    expect(result).toEqual({
      diffs: [
        { kind: 'changed', path: 'title', before: 'Before', after: 'After' },
        {
          kind: 'changed',
          path: 'meta.description',
          before: 'Old description',
          after: 'New description',
        },
      ],
    });
  });
});
