import { describe, expect, test } from 'vitest';
import {
  AppLinksValidator,
  CanonicalValidator,
  HeadingsValidator,
  JsonLdValidator,
  MetaTagsValidator,
  OpenGraphValidator,
  PinterestValidator,
  RobotsTxtValidator,
  TwitterCardValidator,
  VKValidator,
} from './advanced';
import { validateHeadings, validateOpenGraph } from './pipeline';

describe('validators', () => {
  test('validates meta tags', async () => {
    const diagnostics = await new MetaTagsValidator().validate({
      type: 'meta',
      source: '',
      data: { title: '', charset: null, name: {}, httpEquiv: {}, lang: null, itemprop: {} },
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
        expect.objectContaining({ rule: 'opengraph/description-missing' }),
        expect.objectContaining({ rule: 'opengraph/image-not-absolute', path: 'og:image[1]' }),
        expect.objectContaining({ rule: 'opengraph/url-not-absolute', path: 'og:url' }),
        expect.objectContaining({ rule: 'opengraph/type-missing' }),
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

  test('validates extended open graph rules with context', async () => {
    const diagnostics = await new OpenGraphValidator().validate(
      {
        type: 'opengraph',
        source: 'https://example.com/page',
        data: {
          'og:title': 'Standalone OG title',
          'og:type': 'weird-type',
          'og:url': 'https://example.com/og',
          'og:image': 'http://example.com/image.jpg',
          'og:image:type': 'image/avif',
          'og:locale': 'ru',
          'article:published_time': '2024-01-02T10:00:00Z',
          'article:modified_time': '2024-01-01T10:00:00Z',
        },
      },
      [
        {
          type: 'meta',
          source: '',
          data: {
            title: 'Different document title',
            charset: 'utf-8',
            name: {},
            httpEquiv: {},
            lang: 'en',
            itemprop: {},
          },
        },
        {
          type: 'canonical',
          source: '',
          data: {
            canonical: 'https://example.com/canonical',
            hreflang: [{ lang: 'en', href: 'https://example.com/en/page' }],
          },
        },
      ],
    );

    expect(diagnostics.map((entry) => entry.rule)).toEqual(
      expect.arrayContaining([
        'opengraph/description-missing',
        'opengraph/description-fallback-missing',
        'opengraph/title-mismatch-meta',
        'opengraph/type-invalid',
        'opengraph/url-mismatch-canonical',
        'opengraph/image-http',
        'opengraph/image-missing-dimensions',
        'opengraph/image-missing-alt',
        'opengraph/image-avif',
        'opengraph/locale-invalid-format',
        'opengraph/locale-mismatch-lang',
        'opengraph/locale-alternate-mismatch-hreflang',
      ]),
    );
  });

  test('validates twitter, pinterest, vk, app links, jsonld cross rules, and robots social bot blocking', async () => {
    const metaEnvelope = {
      type: 'meta' as const,
      source: 'https://example.com/page',
      data: {
        title: 'Healthy Title Example',
        charset: 'utf-8',
        name: {
          'twitter:card': 'player',
          'twitter:player': 'http://example.com/player',
          pinterest: 'nopin',
          'vk:image': 'https://example.com/vk.jpg',
        },
        httpEquiv: {},
        lang: 'en',
        itemprop: {},
      },
    };
    const opengraphEnvelope = {
      type: 'opengraph' as const,
      source: 'https://example.com/page',
      data: {
        'og:title': 'OG Title',
        'og:image': 'https://example.com/image.jpg',
        'og:description': 'OG Description',
        'al:ios:url': 'example://page',
      },
    };

    const twitterDiagnostics = await new TwitterCardValidator().validate(metaEnvelope, [opengraphEnvelope]);
    expect(twitterDiagnostics.map((entry) => entry.rule)).toEqual(
      expect.arrayContaining([
        'twitter/player-not-https',
        'twitter/player-missing-dimensions',
        'twitter/title-fallback-og',
        'twitter/image-fallback-og',
      ]),
    );

    const pinterestDiagnostics = await new PinterestValidator().validate(metaEnvelope, [opengraphEnvelope]);
    expect(pinterestDiagnostics.map((entry) => entry.rule)).toEqual(
      expect.arrayContaining(['pinterest/nopin-detected', 'pinterest/og-image-vertical-recommended']),
    );

    const vkDiagnostics = await new VKValidator().validate(metaEnvelope, [metaEnvelope, opengraphEnvelope]);
    expect(vkDiagnostics.map((entry) => entry.rule)).toEqual(['vk/image-present']);

    const appLinksDiagnostics = await new AppLinksValidator().validate(opengraphEnvelope);
    expect(appLinksDiagnostics.map((entry) => entry.rule)).toEqual(['applinks/ios-incomplete']);

    const jsonLdDiagnostics = await new JsonLdValidator().validate(
      {
        type: 'jsonld',
        source: 'https://example.com/page',
        data: [
          {
            '@context': 'https://schema.org',
            '@type': 'Article',
            url: 'https://example.com/other',
            name: 'Wrong',
            image: 'https://example.com/other.jpg',
          },
        ],
      },
      [
        { type: 'canonical', source: '', data: { canonical: 'https://example.com/page', hreflang: [] } },
        opengraphEnvelope,
      ],
      { disableAdobeValidation: true },
    );
    expect(jsonLdDiagnostics.map((entry) => entry.rule)).toEqual(
      expect.arrayContaining([
        'jsonld/url-mismatch-canonical',
        'jsonld/name-mismatch-og-title',
        'jsonld/image-mismatch-og-image',
      ]),
    );

    const robotsDiagnostics = await new RobotsTxtValidator().validate({
      type: 'robots-txt',
      source: '',
      data: {
        groups: [{ userAgents: ['TelegramBot'], allow: [], disallow: ['/'] }],
        sitemaps: ['https://example.com/sitemap.xml'],
        crawlDelay: null,
      },
    });
    expect(robotsDiagnostics.map((entry) => entry.rule)).toEqual(
      expect.arrayContaining(['robots/no-wildcard-group', 'robots/blocks-social-bots']),
    );
  });

  test('validator instances expose rule catalogs', () => {
    expect(new OpenGraphValidator().rules.length).toBeGreaterThan(0);
    expect(new HeadingsValidator().rules.length).toBeGreaterThan(0);
  });
});
