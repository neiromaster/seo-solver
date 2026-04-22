import { describe, expect, test } from 'vitest';
import { GenericComparator } from './seo/comparators/generic.js';
import { HeadingsComparator } from './seo/comparators/headings.js';

describe('GenericComparator', () => {
  test('compares opengraph envelopes with deep diff', () => {
    const comparator = new GenericComparator('opengraph');
    const result = comparator.compare(
      { type: 'opengraph', source: '', data: { 'og:title': 'A' } },
      { type: 'opengraph', source: '', data: { 'og:title': 'B' } },
    );

    expect(result).toEqual([{ kind: 'changed', path: 'og:title', before: 'A', after: 'B' }]);
  });

  test('supports jsonld root prefixes', () => {
    const comparator = new GenericComparator('jsonld', { pathPrefix: '$' });
    const result = comparator.compare(
      { type: 'jsonld', source: '', data: [{ '@type': 'Thing' }] },
      { type: 'jsonld', source: '', data: [{ '@type': 'Article' }] },
    );

    expect(result).toEqual([{ kind: 'changed', path: '$[0].@type', before: 'Thing', after: 'Article' }]);
  });
});

describe('HeadingsComparator', () => {
  test('detects inserted headings in the middle', () => {
    const comparator = new HeadingsComparator();
    const result = comparator.compare(
      {
        type: 'headings',
        source: '',
        data: [
          { level: 1, text: 'Welcome' },
          { level: 2, text: 'Features' },
          { level: 2, text: 'Pricing' },
        ],
      },
      {
        type: 'headings',
        source: '',
        data: [
          { level: 1, text: 'Welcome' },
          { level: 2, text: 'Features' },
          { level: 3, text: 'Enterprise' },
          { level: 2, text: 'Pricing' },
        ],
      },
    );

    expect(result).toEqual([{ kind: 'added', path: '[2]', after: { level: 3, text: 'Enterprise' } }]);
  });

  test('treats text changes as changed fields', () => {
    const comparator = new HeadingsComparator();
    const result = comparator.compare(
      { type: 'headings', source: '', data: [{ level: 1, text: 'Old' }] },
      { type: 'headings', source: '', data: [{ level: 1, text: 'New' }] },
    );

    expect(result).toEqual([{ kind: 'changed', path: '[0].text', before: 'Old', after: 'New' }]);
  });

  test('treats level changes as changed fields', () => {
    const comparator = new HeadingsComparator();
    const result = comparator.compare(
      { type: 'headings', source: '', data: [{ level: 2, text: 'Pricing' }] },
      { type: 'headings', source: '', data: [{ level: 3, text: 'Pricing' }] },
    );

    expect(result).toEqual([{ kind: 'changed', path: '[0].level', before: 2, after: 3 }]);
  });

  test('handles multiple insertions without noisy changes', () => {
    const comparator = new HeadingsComparator();
    const result = comparator.compare(
      {
        type: 'headings',
        source: '',
        data: [
          { level: 1, text: 'Welcome' },
          { level: 2, text: 'Pricing' },
        ],
      },
      {
        type: 'headings',
        source: '',
        data: [
          { level: 1, text: 'Welcome' },
          { level: 3, text: 'Enterprise' },
          { level: 3, text: 'FAQ' },
          { level: 2, text: 'Pricing' },
        ],
      },
    );

    expect(result).toEqual([
      { kind: 'added', path: '[1]', after: { level: 3, text: 'Enterprise' } },
      { kind: 'added', path: '[2]', after: { level: 3, text: 'FAQ' } },
    ]);
  });
});
