import type { Comparator } from '@seo-solver/types/compare-advanced';
import { describe, expect, test } from 'vitest';
import {
  compareAll,
  compareCanonical,
  compareHeadings,
  compareJsonLd,
  compareMetaTags,
  compareOpenGraph,
  compareRobotsTxt,
  createComparisonPipeline,
} from './pipeline';

describe('createComparisonPipeline', () => {
  test('compares matching types in order and preserves identical results', () => {
    const result = createComparisonPipeline().compare(
      [
        { type: 'opengraph', source: 'https://a.example', data: { 'og:title': 'A' } },
        {
          type: 'meta',
          source: 'https://a.example',
          data: { title: 'T', charset: 'utf-8', name: {}, httpEquiv: {}, lang: null, itemprop: {} },
        },
      ],
      [
        { type: 'opengraph', source: 'https://b.example', data: { 'og:title': 'B' } },
        {
          type: 'meta',
          source: 'https://b.example',
          data: { title: 'T', charset: 'utf-8', name: {}, httpEquiv: {}, lang: null, itemprop: {} },
        },
      ],
    );

    expect(result).toEqual([
      {
        type: 'opengraph',
        sourceA: 'https://a.example',
        sourceB: 'https://b.example',
        diffs: [{ kind: 'changed', path: 'og:title', before: 'A', after: 'B' }],
      },
      {
        type: 'meta',
        sourceA: 'https://a.example',
        sourceB: 'https://b.example',
        diffs: [],
      },
    ]);
  });

  test('reports removed and added types at the type level', () => {
    const result = createComparisonPipeline().compare(
      [
        {
          type: 'meta',
          source: 'https://a.example',
          data: { title: null, charset: null, name: {}, httpEquiv: {}, lang: null, itemprop: {} },
        },
      ],
      [{ type: 'canonical', source: 'https://b.example', data: { canonical: 'https://b.example', hreflang: [] } }],
    );

    expect(result).toEqual([
      {
        type: 'meta',
        sourceA: 'https://a.example',
        sourceB: 'https://b.example',
        diffs: [
          {
            kind: 'removed',
            path: '',
            before: { title: null, charset: null, name: {}, httpEquiv: {}, lang: null, itemprop: {} },
          },
        ],
      },
      {
        type: 'canonical',
        sourceA: 'https://a.example',
        sourceB: 'https://b.example',
        diffs: [{ kind: 'added', path: '', after: { canonical: 'https://b.example', hreflang: [] } }],
      },
    ]);
  });

  test('supports selected types and ignoreFields', () => {
    const result = createComparisonPipeline({
      types: ['opengraph', 'meta'],
      ignoreFields: { opengraph: ['og:image'] },
    }).compare(
      [{ type: 'opengraph', source: '', data: { 'og:title': 'A', 'og:image': ['a.jpg'] } }],
      [{ type: 'opengraph', source: '', data: { 'og:title': 'A', 'og:image': ['b.jpg'] } }],
    );

    expect(result).toEqual([{ type: 'opengraph', sourceA: '', sourceB: '', diffs: [] }]);
  });

  test('supports per-call type overrides', () => {
    const pipeline = createComparisonPipeline({ types: ['opengraph', 'meta'] });
    const result = pipeline.compare(
      [
        { type: 'opengraph', source: '', data: { 'og:title': 'A' } },
        {
          type: 'meta',
          source: '',
          data: { title: 'A', charset: null, name: {}, httpEquiv: {}, lang: null, itemprop: {} },
        },
      ],
      [
        { type: 'opengraph', source: '', data: { 'og:title': 'B' } },
        {
          type: 'meta',
          source: '',
          data: { title: 'B', charset: null, name: {}, httpEquiv: {}, lang: null, itemprop: {} },
        },
      ],
      { types: ['meta'] },
    );

    expect(result.map((entry) => entry.type)).toEqual(['meta']);
  });

  test('respects selected type order', () => {
    const result = createComparisonPipeline({ types: ['meta', 'opengraph'] }).compare(
      [
        { type: 'opengraph', source: '', data: { 'og:title': 'A' } },
        {
          type: 'meta',
          source: '',
          data: { title: 'A', charset: null, name: {}, httpEquiv: {}, lang: null, itemprop: {} },
        },
      ],
      [
        { type: 'opengraph', source: '', data: { 'og:title': 'B' } },
        {
          type: 'meta',
          source: '',
          data: { title: 'B', charset: null, name: {}, httpEquiv: {}, lang: null, itemprop: {} },
        },
      ],
    );

    expect(result.map((entry) => entry.type)).toEqual(['meta', 'opengraph']);
  });

  test('supports custom comparators', () => {
    const customComparator: Comparator = {
      type: 'meta',
      compare() {
        return [{ kind: 'changed', path: 'title', before: 'A', after: 'forced' }];
      },
    };

    const result = createComparisonPipeline({ comparators: [customComparator] }).compare(
      [
        {
          type: 'meta',
          source: '',
          data: { title: 'A', charset: null, name: {}, httpEquiv: {}, lang: null, itemprop: {} },
        },
      ],
      [
        {
          type: 'meta',
          source: '',
          data: { title: 'B', charset: null, name: {}, httpEquiv: {}, lang: null, itemprop: {} },
        },
      ],
    );

    expect(result[0]?.diffs).toEqual([{ kind: 'changed', path: 'title', before: 'A', after: 'forced' }]);
  });
});

describe('level 1 compare functions', () => {
  test('compareOpenGraph returns diff entries', () => {
    expect(compareOpenGraph({ 'og:title': 'A' }, { 'og:title': 'B' })).toEqual([
      { kind: 'changed', path: 'og:title', before: 'A', after: 'B' },
    ]);
  });

  test('compareJsonLd uses jsonld root paths', () => {
    expect(compareJsonLd([{ '@type': 'Thing' }], [{ '@type': 'Article' }])).toEqual([
      { kind: 'changed', path: '$[0].@type', before: 'Thing', after: 'Article' },
    ]);
  });

  test('compareMetaTags returns diff entries', () => {
    expect(
      compareMetaTags(
        { title: 'A', charset: null, name: {}, httpEquiv: {}, lang: null, itemprop: {} },
        { title: 'B', charset: null, name: {}, httpEquiv: {}, lang: null, itemprop: {} },
      ),
    ).toEqual([{ kind: 'changed', path: 'title', before: 'A', after: 'B' }]);
  });

  test('compareHeadings uses headings-aware comparison', () => {
    expect(
      compareHeadings(
        [
          { level: 1, text: 'Welcome' },
          { level: 2, text: 'Pricing' },
        ],
        [
          { level: 1, text: 'Welcome' },
          { level: 3, text: 'Enterprise' },
          { level: 2, text: 'Pricing' },
        ],
      ),
    ).toEqual([{ kind: 'added', path: '[1]', after: { level: 3, text: 'Enterprise' } }]);
  });

  test('compareCanonical returns diff entries', () => {
    expect(
      compareCanonical(
        { canonical: 'https://a.example', hreflang: [] },
        { canonical: 'https://b.example', hreflang: [] },
      ),
    ).toEqual([{ kind: 'changed', path: 'canonical', before: 'https://a.example', after: 'https://b.example' }]);
  });

  test('compareRobotsTxt returns diff entries', () => {
    expect(
      compareRobotsTxt(
        { groups: [], sitemaps: ['https://a.example/sitemap.xml'], crawlDelay: null },
        { groups: [], sitemaps: ['https://b.example/sitemap.xml'], crawlDelay: null },
      ),
    ).toEqual([
      {
        kind: 'changed',
        path: 'sitemaps[0]',
        before: 'https://a.example/sitemap.xml',
        after: 'https://b.example/sitemap.xml',
      },
    ]);
  });

  test('compareAll uses the default pipeline', () => {
    expect(
      compareAll(
        [{ type: 'opengraph', source: '', data: { 'og:title': 'A' } }],
        [{ type: 'opengraph', source: '', data: { 'og:title': 'B' } }],
      ),
    ).toEqual([
      {
        type: 'opengraph',
        sourceA: '',
        sourceB: '',
        diffs: [{ kind: 'changed', path: 'og:title', before: 'A', after: 'B' }],
      },
    ]);
  });
});
