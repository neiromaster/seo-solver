import { describe, expect, test } from 'vitest';
import { createValidationPipeline, validateAll } from './index.js';

describe('createValidationPipeline', () => {
  test('validates envelopes in order', async () => {
    const envelopes = [
      { type: 'meta', source: 'https://example.com', data: { title: null, charset: 'utf-8', name: {}, httpEquiv: {} } },
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
      { type: 'meta', source: '', data: { title: null, charset: null, name: {}, httpEquiv: {} } },
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
      { type: 'meta', source: '', data: { title: null, charset: null, name: {}, httpEquiv: {} } },
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
      { type: 'meta', source: '', data: { title: 'Long enough title', charset: 'utf-8', name: {}, httpEquiv: {} } },
    ]);

    expect(result[0]?.diagnostics).toEqual([
      { severity: 'error', rule: 'meta/description-missing', message: 'Meta description is missing' },
    ]);
  });

  test('supports per-call disabled rule union', async () => {
    const pipeline = createValidationPipeline({ disableRules: ['meta/charset-missing'] });
    const result = await pipeline.validate(
      [{ type: 'meta', source: '', data: { title: null, charset: null, name: {}, httpEquiv: {} } }],
      { disableRules: ['meta/viewport-missing'] },
    );

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
    expect(createValidationPipeline().rules.some((entry) => entry.rule === 'og/title-missing')).toBe(true);
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
});
