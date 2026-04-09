import { describe, expect, test } from 'vitest';
import {
  CanonicalValidator,
  HeadingsValidator,
  MetaTagsValidator,
  OpenGraphValidator,
  RobotsTxtValidator,
  validateHeadings,
  validateOpenGraph,
} from './index.js';

describe('validators', () => {
  test('validates meta tags', async () => {
    const diagnostics = await new MetaTagsValidator().validate({
      type: 'meta',
      source: '',
      data: { title: '', charset: null, name: {}, httpEquiv: {} },
    });

    expect(diagnostics.map((entry) => entry.rule)).toEqual([
      'meta/title-empty',
      'meta/description-missing',
      'meta/viewport-missing',
      'meta/charset-missing',
    ]);
  });

  test('validates open graph arrays and level 1 helper', async () => {
    const diagnostics = await validateOpenGraph({
      'og:title': 'Title',
      'og:image': ['https://example.com/good.jpg', '/bad.jpg'],
      'og:url': '/page',
    });

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'og/description-missing' }),
        expect.objectContaining({ rule: 'og/image-not-absolute', path: 'og:image[1]' }),
        expect.objectContaining({ rule: 'og/url-not-absolute', path: 'og:url' }),
        expect.objectContaining({ rule: 'og/type-missing' }),
      ]),
    );
  });

  test('validates headings', async () => {
    const diagnostics = await validateHeadings([
      { level: 2, text: 'Section' },
      { level: 4, text: '' },
    ]);

    expect(diagnostics.map((entry) => entry.rule)).toEqual([
      'headings/missing-h1',
      'headings/skipped-level',
      'headings/empty-heading',
      'headings/first-not-h1',
    ]);
  });

  test('validates canonical cross-checks with context', async () => {
    const diagnostics = await new CanonicalValidator().validate(
      {
        type: 'canonical',
        source: 'https://example.com/page',
        data: {
          canonical: 'https://example.com/page',
          hreflang: [{ lang: 'en', href: 'https://example.com/en/page' }],
        },
      },
      [{ type: 'opengraph', source: '', data: { 'og:url': 'https://example.com/other' } }],
    );

    expect(diagnostics.map((entry) => entry.rule)).toEqual([
      'canonical/mismatch-og-url',
      'canonical/hreflang-missing-x-default',
      'canonical/hreflang-missing-self',
    ]);
  });

  test('validates robots rules', async () => {
    const diagnostics = await new RobotsTxtValidator().validate({
      type: 'robots-txt',
      source: '',
      data: {
        groups: [{ userAgents: ['*'], allow: [], disallow: ['/'] }],
        sitemaps: ['/sitemap.xml'],
        crawlDelay: 15,
      },
    });

    expect(diagnostics.map((entry) => entry.rule)).toEqual([
      'robots/sitemap-not-absolute',
      'robots/disallow-all',
      'robots/crawl-delay-too-high',
    ]);
  });

  test('validator instances expose rule catalogs', () => {
    expect(new OpenGraphValidator().rules.length).toBeGreaterThan(0);
    expect(new HeadingsValidator().rules.length).toBeGreaterThan(0);
  });
});
