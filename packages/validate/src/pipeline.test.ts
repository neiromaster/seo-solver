import { createExtractorPipeline, htmlToMinimalFetchResult } from '@seo-solver/extract/advanced';
import type { ExtractedPage } from '@seo-solver/types/extract';
import { describe, expect, test } from 'vitest';
import { createValidationPipeline } from './advanced.js';
import {
  type ValidateDataOptions,
  type ValidateJsonLdOptions,
  validateAll,
  validateJsonLd,
  validateMetaTags,
  validateOpenGraph,
  validatePage,
} from './pipeline.js';

describe('validatePage', () => {
  test('treats sparse extracted data as omitted targets rather than empty envelopes', async () => {
    const page: ExtractedPage = {
      source: {
        requestUrl: 'https://example.com',
        url: 'https://example.com',
        statusCode: 200,
        resourceType: 'html',
        redirects: [],
        timing: 0,
        attempts: 1,
        fetchedAt: '2026-04-20T00:00:00.000Z',
      },
      data: {
        headings: [],
      },
      targetStatus: {
        headings: 'present',
      },
      errors: [],
    };

    const report = await validatePage(page);
    expect(report.validations.map((entry) => entry.type)).toEqual(['headings']);
  });

  test('emits section-missing diagnostics for requested missing sections only', async () => {
    const page: ExtractedPage = {
      source: {
        requestUrl: 'https://example.com',
        url: 'https://example.com',
        statusCode: 200,
        resourceType: 'html',
        redirects: [],
        timing: 0,
        attempts: 1,
        fetchedAt: '2026-04-20T00:00:00.000Z',
      },
      data: {
        meta: null,
      },
      targetStatus: {
        meta: 'missing',
      },
      errors: [],
    };

    const report = await validatePage(page);
    expect(report.validations).toEqual([
      {
        type: 'meta',
        source: 'https://example.com',
        diagnostics: [
          {
            severity: 'warning',
            rule: 'meta/section-missing',
            message: 'Meta section is missing',
          },
        ],
      },
    ]);
  });

  test('does not emit diagnostics for targets that were not requested', async () => {
    const page: ExtractedPage = {
      source: {
        requestUrl: 'https://example.com',
        url: 'https://example.com',
        statusCode: 200,
        resourceType: 'html',
        redirects: [],
        timing: 0,
        attempts: 1,
        fetchedAt: '2026-04-20T00:00:00.000Z',
      },
      data: {},
      targetStatus: {},
      errors: [],
    };

    const report = await validatePage(page);
    expect(report.validations).toEqual([]);
  });

  test('falls back to sparse page data when targetStatus is absent', async () => {
    const page = {
      source: {
        requestUrl: 'https://example.com',
        url: 'https://example.com',
        statusCode: 200,
        resourceType: 'html' as const,
        redirects: [],
        timing: 0,
        attempts: 1,
        fetchedAt: '2026-04-20T00:00:00.000Z',
      },
      data: {
        meta: null,
      },
      errors: [],
    };

    const report = await validatePage(page);
    expect(report.validations).toEqual([
      {
        type: 'meta',
        source: 'https://example.com',
        diagnostics: [
          {
            severity: 'warning',
            rule: 'meta/section-missing',
            message: 'Meta section is missing',
          },
        ],
      },
    ]);
  });

  test('surfaces extractor warnings as validation errors', async () => {
    const page: ExtractedPage = {
      source: {
        requestUrl: 'https://example.com',
        url: 'https://example.com',
        statusCode: 200,
        resourceType: 'html',
        redirects: [],
        timing: 0,
        attempts: 1,
        fetchedAt: '2026-04-20T00:00:00.000Z',
      },
      data: {
        jsonld: [],
      },
      targetStatus: {
        jsonld: 'present',
      },
      errors: [
        {
          extractor: 'jsonld',
          message: 'Invalid JSON-LD block',
          path: 'script[0]',
        },
      ],
    };

    const report = await validatePage(page);
    expect(report.validations).toEqual([
      {
        type: 'jsonld',
        source: 'https://example.com',
        diagnostics: [
          {
            severity: 'error',
            rule: 'extract/jsonld-warning',
            message: 'Invalid JSON-LD block',
            path: 'script[0]',
          },
        ],
      },
    ]);
  });

  test('includes section-missing rules in listRules with expected severities', async () => {
    const { listRules } = await import('./rule-catalog.js');
    const sectionMissingRules = listRules().filter((entry) => entry.id.endsWith('/section-missing'));

    expect(sectionMissingRules.map((entry) => entry.id).sort()).toEqual([
      'canonical/section-missing',
      'headings/section-missing',
      'jsonld/section-missing',
      'meta/section-missing',
      'opengraph/section-missing',
      'robots/section-missing',
    ]);
    expect(sectionMissingRules.find((entry) => entry.id === 'robots/section-missing')?.severity).toBe('info');
    expect(
      sectionMissingRules
        .filter((entry) => entry.id !== 'robots/section-missing')
        .every((entry) => entry.severity === 'warning'),
    ).toBe(true);
  });
});

describe('direct validation helpers', () => {
  test('validateMetaTags returns diagnostics directly', async () => {
    const diagnostics = await validateMetaTags({
      title: null,
      charset: null,
      name: {},
      httpEquiv: {},
      lang: null,
      itemprop: {},
    });

    expect(Array.isArray(diagnostics)).toBe(true);
    expect(diagnostics.map((entry) => entry.rule)).toEqual([
      'meta/title-missing',
      'meta/description-missing',
      'meta/viewport-missing',
      'meta/charset-missing',
    ]);
  });

  test('validateMetaTags supports disabled rules', async () => {
    const diagnostics = await validateMetaTags(
      {
        title: null,
        charset: null,
        name: {},
        httpEquiv: {},
        lang: null,
        itemprop: {},
      },
      { disableRules: ['meta/viewport-missing'] },
    );

    expect(diagnostics.map((entry) => entry.rule)).not.toContain('meta/viewport-missing');
  });

  test('validateMetaTags supports severity overrides', async () => {
    const diagnostics = await validateMetaTags(
      {
        title: 'Long enough title',
        charset: 'utf-8',
        name: {},
        httpEquiv: {},
        lang: null,
        itemprop: {},
      },
      { severityOverrides: { 'meta/description-missing': 'error' } },
    );

    expect(diagnostics).toEqual([
      { severity: 'error', rule: 'meta/description-missing', message: 'Meta description is missing' },
      {
        severity: 'warning',
        rule: 'meta/viewport-missing',
        message: 'Viewport meta tag is missing (required for mobile)',
      },
    ]);
  });

  test('direct helper option types keep runtime specific to JSON-LD', () => {
    const jsonLdOptions: ValidateJsonLdOptions = { runtime: { jsonldAdobe: { enabled: false } } };
    const dataOptions: ValidateDataOptions = { disableRules: ['meta/viewport-missing'] };

    expect(jsonLdOptions.runtime?.jsonldAdobe?.enabled).toBe(false);
    expect(dataOptions.disableRules).toEqual(['meta/viewport-missing']);
  });

  test('validateJsonLd accepts JSON-LD-specific runtime options shape', async () => {
    const diagnostics = await validateJsonLd([{ '@type': 'Article' }], {
      runtime: { jsonldAdobe: { enabled: false } },
    });

    expect(diagnostics).toEqual([
      {
        severity: 'error',
        rule: 'jsonld/missing-context',
        message: 'JSON-LD object is missing @context',
        path: '$[0].@context',
      },
    ]);
  });

  test('validateOpenGraph does not emit page-level section-missing diagnostics', async () => {
    const diagnostics = await validateOpenGraph({});

    expect(diagnostics.map((entry) => entry.rule)).not.toContain('opengraph/section-missing');
    expect(diagnostics.map((entry) => entry.rule)).toContain('opengraph/title-missing');
  });
});

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
