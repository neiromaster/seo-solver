import { createExtractorPipeline, htmlToMinimalFetchResult } from '@seo-solver/extract/advanced';
import { describe, expect, test } from 'vitest';
import { createValidationPipeline } from './advanced';
import { validateAll } from './pipeline';

describe('createValidationPipeline', () => {
  test('validates envelopes in order', async () => {
    const envelopes = [
      {
        type: 'meta',
        source: 'https://example.com',
        data: { title: null, charset: 'utf-8', name: {}, httpEquiv: {}, lang: null, itemprop: {} },
      },
      { type: 'headings', source: 'https://example.com', data: [{ level: 1, text: 'Heading' }] },
    ];

    const result = await createValidationPipeline().validate(envelopes);
    expect(result.map((entry) => entry.type)).toEqual(['meta', 'headings']);
    expect(result[0]?.diagnostics.map((entry) => entry.rule)).toEqual([
      'meta/title-missing',
      'meta/description-missing',
      'meta/viewport-missing',
    ]);
    expect(result[1]?.diagnostics).toEqual([]);
  });

  test('supports selective validators', async () => {
    const result = await createValidationPipeline({ validators: ['meta'] }).validate([
      {
        type: 'meta',
        source: '',
        data: { title: null, charset: null, name: {}, httpEquiv: {}, lang: null, itemprop: {} },
      },
      { type: 'headings', source: '', data: [] },
    ]);

    expect(result.map((entry) => entry.type)).toEqual(['meta']);
  });

  test('skips unknown envelope types without error', async () => {
    const result = await createValidationPipeline().validate([{ type: 'unknown', source: '', data: { foo: 'bar' } }]);
    expect(result).toEqual([]);
  });

  test('supports custom validators', async () => {
    const customValidator = {
      type: 'meta',
      async validate() {
        return [{ severity: 'info' as const, rule: 'custom/ran', message: 'custom validator ran' }];
      },
    };

    const result = await createValidationPipeline({ validators: [customValidator] }).validate([
      {
        type: 'meta',
        source: '',
        data: { title: null, charset: null, name: {}, httpEquiv: {}, lang: null, itemprop: {} },
      },
    ]);

    expect(result).toEqual([
      {
        type: 'meta',
        source: '',
        diagnostics: [{ severity: 'info', rule: 'custom/ran', message: 'custom validator ran' }],
      },
    ]);
  });

  test('supports disabled rules and severity overrides', async () => {
    const pipeline = createValidationPipeline({
      disableRules: ['meta/viewport-missing'],
      severityOverrides: { 'meta/description-missing': 'error' },
    });

    const result = await pipeline.validate([
      {
        type: 'meta',
        source: '',
        data: { title: 'Long enough title', charset: 'utf-8', name: {}, httpEquiv: {}, lang: null, itemprop: {} },
      },
    ]);

    expect(result[0]?.diagnostics).toEqual([
      { severity: 'error', rule: 'meta/description-missing', message: 'Meta description is missing' },
    ]);
  });

  test('uses factory-owned disabled rules configuration', async () => {
    const pipeline = createValidationPipeline({
      disableRules: ['meta/charset-missing', 'meta/viewport-missing'],
    });
    const result = await pipeline.validate([
      {
        type: 'meta',
        source: '',
        data: { title: null, charset: null, name: {}, httpEquiv: {}, lang: null, itemprop: {} },
      },
    ]);

    expect(result[0]?.diagnostics.map((entry) => entry.rule)).toEqual([
      'meta/title-missing',
      'meta/description-missing',
    ]);
  });

  test('validateAll uses default pipeline', async () => {
    const result = await validateAll([{ type: 'headings', source: '', data: [] }]);
    expect(result).toEqual([
      {
        type: 'headings',
        source: '',
        diagnostics: [{ severity: 'error', rule: 'headings/missing-h1', message: 'Page has no <h1> heading' }],
      },
    ]);
  });

  test('exposes built-in rule catalog', () => {
    expect(createValidationPipeline().rules.some((entry) => entry.rule === 'opengraph/title-missing')).toBe(true);
  });

  test('forwards context for cross-validation', async () => {
    const result = await createValidationPipeline().validate([
      {
        type: 'canonical',
        source: 'https://example.com/page',
        data: { canonical: 'https://example.com/page', hreflang: [] },
      },
      { type: 'opengraph', source: 'https://example.com/page', data: { 'og:url': 'https://example.com/other' } },
    ]);

    expect(result[0]?.diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ rule: 'canonical/mismatch-og-url' })]),
    );
  });

  test('runs wildcard cross validators once and merges diagnostics into existing results', async () => {
    const result = await createValidationPipeline().validate([
      {
        type: 'meta',
        source: 'https://example.com/page',
        data: {
          title: 'Healthy Title Example',
          charset: 'utf-8',
          name: { robots: 'noindex,follow' },
          httpEquiv: {},
          lang: 'en',
          itemprop: {},
        },
      },
      {
        type: 'opengraph',
        source: 'https://example.com/page',
        data: {
          'og:title': 'Article title',
          'og:type': 'website',
          'article:published_time': '2024-01-01T00:00:00Z',
        },
      },
    ]);

    expect(result.map((entry) => entry.type)).toEqual(['meta', 'opengraph']);
    expect(result[0]?.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'cross/noindex-with-seo' }),
        expect.objectContaining({ rule: 'cross/og-type-content-mismatch' }),
      ]),
    );
  });

  test('treats twitter and itemprop metadata as seo signals for noindex cross-validation', async () => {
    const result = await createValidationPipeline().validate([
      {
        type: 'meta',
        source: 'https://example.com/page',
        data: {
          title: 'Healthy Title Example',
          charset: 'utf-8',
          name: {
            robots: 'noindex,follow',
            'twitter:card': 'summary',
          },
          httpEquiv: {},
          lang: 'en',
          itemprop: { image: 'https://example.com/itemprop.jpg' },
        },
      },
    ]);

    expect(result[0]?.diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ rule: 'cross/noindex-with-seo' })]),
    );
  });

  test('validates app links and vk rules from real extracted html', async () => {
    const html =
      '<!doctype html><html lang="en"><head><title>Example page title</title><meta name="description" content="A sufficiently descriptive meta description for validation coverage."><meta name="viewport" content="width=device-width, initial-scale=1"><meta property="og:title" content="OG Title"><meta property="og:image" content="https://example.com/og.jpg"><meta property="al:ios:url" content="example://page"><meta property="vk:image" content="https://example.com/vk-property.jpg"><meta name="vk:image" content="https://example.com/vk-name.jpg"></head><body><h1>Heading</h1></body></html>';
    const envelopes = createExtractorPipeline().extract(htmlToMinimalFetchResult(html, 'html'));

    const result = await createValidationPipeline().validate(envelopes);

    expect(result.find((entry) => entry.type === 'opengraph')?.diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ rule: 'applinks/ios-incomplete' })]),
    );
    expect(result.find((entry) => entry.type === 'opengraph')?.diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ rule: 'vk/image-present' })]),
    );
  });

  test('validates vk property-only markup without requiring a meta envelope', async () => {
    const html =
      '<!doctype html><html><head><meta property="vk:image" content="https://example.com/vk-property.jpg"></head><body></body></html>';
    const envelopes = createExtractorPipeline().extract(htmlToMinimalFetchResult(html, 'html'));

    expect(envelopes.map((entry) => entry.type)).toEqual(['opengraph']);

    const result = await createValidationPipeline().validate(envelopes);

    expect(result[0]?.diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ rule: 'vk/image-present' })]),
    );
  });
});
