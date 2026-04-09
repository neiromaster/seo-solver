import { beforeEach, describe, expect, test, vi } from 'vitest';

const { validateSpy, readFileMock, statMock, writeFileMock, mkdirMock } = vi.hoisted(() => ({
  validateSpy: vi.fn(),
  readFileMock: vi.fn(),
  statMock: vi.fn(),
  writeFileMock: vi.fn(),
  mkdirMock: vi.fn(),
}));

vi.mock('@adobe/structured-data-validator', () => ({
  default: class MockAdobeValidator {
    validate = validateSpy;
  },
}));

vi.mock('node:fs/promises', () => ({
  readFile: readFileMock,
  stat: statMock,
  writeFile: writeFileMock,
  mkdir: mkdirMock,
}));

import { createValidationPipeline, validateJsonLd } from './index.js';

describe('JsonLdValidator', () => {
  beforeEach(() => {
    validateSpy.mockReset();
    readFileMock.mockReset();
    statMock.mockReset();
    writeFileMock.mockReset();
    mkdirMock.mockReset();
    vi.unstubAllGlobals();
  });

  test('uses Adobe default export and returns structural paths', async () => {
    readFileMock.mockRejectedValue(new Error('cache miss'));
    statMock.mockRejectedValue(new Error('cache miss'));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ '@graph': [] }) }));
    validateSpy.mockResolvedValue([
      {
        issueMessage: 'Required attribute "price" is missing',
        severity: 'ERROR',
        path: [{ type: 'Product', index: 0 }],
        fieldNames: ['offers.price'],
      },
    ]);

    const result = await validateJsonLd([
      { '@context': 'https://schema.org', name: 'Missing type' },
      { '@context': 'https://schema.org', '@type': 'Product', name: 'Product without price' },
    ]);

    expect(result).toEqual([
      {
        severity: 'error',
        rule: 'jsonld/missing-type',
        message: 'JSON-LD object is missing @type',
        path: '$[0].@type',
      },
      {
        severity: 'error',
        rule: 'jsonld/adobe/required-attribute-price-is-missing',
        message: 'Required attribute "price" is missing',
        path: 'Product[0]',
      },
    ]);
    expect(validateSpy).toHaveBeenCalledTimes(1);
  });

  test('skips Adobe validation with warning when schema is unavailable', async () => {
    readFileMock.mockRejectedValue(new Error('cache miss'));
    statMock.mockRejectedValue(new Error('cache miss'));
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const result = await validateJsonLd([{ '@context': 'https://schema.org', '@type': 'Article' }]);

    expect(result).toEqual([
      {
        severity: 'warning',
        rule: 'jsonld/adobe/schema-unavailable',
        message: 'Schema.org schema is unavailable, so Adobe validation was skipped',
      },
    ]);
    expect(validateSpy).not.toHaveBeenCalled();
  });

  test('does not run Adobe validation when wildcard disabled', async () => {
    readFileMock.mockRejectedValue(new Error('cache miss'));
    statMock.mockRejectedValue(new Error('cache miss'));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ '@graph': [] }) }));
    validateSpy.mockResolvedValue([{ issueMessage: 'Should not run', severity: 'WARNING' }]);

    const result = await createValidationPipeline({ disableRules: ['jsonld/adobe/*'] }).validate([
      { type: 'jsonld', source: '', data: [{ '@context': 'https://schema.org', '@type': 'Article', name: 'Hello' }] },
    ]);

    expect(result).toEqual([{ type: 'jsonld', source: '', diagnostics: [] }]);
    expect(validateSpy).not.toHaveBeenCalled();
  });

  test('does not run any JSON-LD validation work when jsonld namespace is wildcard disabled', async () => {
    readFileMock.mockRejectedValue(new Error('cache miss'));
    statMock.mockRejectedValue(new Error('cache miss'));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ '@graph': [] }) }));
    validateSpy.mockResolvedValue([{ issueMessage: 'Should not run', severity: 'WARNING' }]);

    const result = await createValidationPipeline({ disableRules: ['jsonld/*'] }).validate([
      { type: 'jsonld', source: '', data: [{ '@context': 'https://schema.org', name: 'Missing type' }] },
    ]);

    expect(result).toEqual([{ type: 'jsonld', source: '', diagnostics: [] }]);
    expect(validateSpy).not.toHaveBeenCalled();
  });

  test('returns warning diagnostic when Adobe validation throws', async () => {
    readFileMock.mockRejectedValue(new Error('cache miss'));
    statMock.mockRejectedValue(new Error('cache miss'));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ '@graph': [] }) }));
    validateSpy.mockRejectedValue(new Error('boom'));

    const result = await validateJsonLd([{ '@context': 'https://schema.org', '@type': 'Article', name: 'Hello' }]);

    expect(result).toEqual([
      {
        severity: 'warning',
        rule: 'jsonld/adobe/validation-failed',
        message: 'Adobe structured data validation failed and was skipped: boom',
      },
    ]);
  });

  test('exact Adobe rule disable filters one rule without suppressing Adobe validation', async () => {
    readFileMock.mockRejectedValue(new Error('cache miss'));
    statMock.mockRejectedValue(new Error('cache miss'));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ '@graph': [] }) }));
    validateSpy.mockResolvedValue([
      {
        issueMessage: 'Required attribute "price" is missing',
        severity: 'ERROR',
        path: [{ type: 'Product', index: 0 }],
      },
      {
        issueMessage: 'Required attribute "name" is missing',
        severity: 'ERROR',
        path: [{ type: 'Product', index: 0 }],
      },
    ]);

    const result = await createValidationPipeline({
      disableRules: ['jsonld/adobe/required-attribute-price-is-missing'],
    }).validate([{ type: 'jsonld', source: '', data: [{ '@context': 'https://schema.org', '@type': 'Product' }] }]);

    expect(validateSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      {
        type: 'jsonld',
        source: '',
        diagnostics: [
          {
            severity: 'error',
            rule: 'jsonld/adobe/required-attribute-name-is-missing',
            message: 'Required attribute "name" is missing',
            path: 'Product[0]',
          },
        ],
      },
    ]);
  });
});
