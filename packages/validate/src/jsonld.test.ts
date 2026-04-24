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

import { createValidationPipeline } from './advanced.js';
import { validateJsonLd } from './api/validate-targets.js';

describe('JsonLdValidator', () => {
  beforeEach(() => {
    validateSpy.mockReset();
    readFileMock.mockReset();
    statMock.mockReset();
    writeFileMock.mockReset();
    mkdirMock.mockReset();
    vi.unstubAllGlobals();
  });

  test('uses Adobe runtime when explicitly enabled and returns structural paths', async () => {
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

    const result = await validateJsonLd(
      [
        { '@context': 'https://schema.org', name: 'Missing type' },
        { '@context': 'https://schema.org', '@type': 'Product', name: 'Product without price' },
      ],
      { runtime: { jsonldAdobe: { enabled: true } } },
    );

    expect(result).toEqual([
      {
        severity: 'error',
        rule: 'jsonld/missing-type',
        message: 'JSON-LD object is missing @type',
        path: '$[0].@type',
      },
      {
        severity: 'error',
        rule: 'jsonld/adobe/required-missing',
        message: 'Required attribute "price" is missing',
        path: 'Product[0]',
      },
    ]);
    expect(validateSpy).toHaveBeenCalledTimes(1);
  });

  test('pure validation is the default and skips Adobe runtime work', async () => {
    readFileMock.mockRejectedValue(new Error('cache miss'));
    statMock.mockRejectedValue(new Error('cache miss'));
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const result = await validateJsonLd([{ '@context': 'https://schema.org', '@type': 'Article' }]);

    expect(result).toEqual([]);
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

  test('returns runtime warning diagnostic when Adobe validation throws', async () => {
    readFileMock.mockRejectedValue(new Error('cache miss'));
    statMock.mockRejectedValue(new Error('cache miss'));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ '@graph': [] }) }));
    validateSpy.mockRejectedValue(new Error('boom'));

    const result = await validateJsonLd([{ '@context': 'https://schema.org', '@type': 'Article', name: 'Hello' }], {
      runtime: { jsonldAdobe: { enabled: true } },
    });

    expect(result).toEqual([
      {
        severity: 'info',
        rule: 'jsonld/runtime-unavailable',
        message: 'JSON-LD runtime validation was unavailable and skipped: boom',
      },
    ]);
  });

  test('exact Adobe rule disable filters the whole short-id bucket without suppressing Adobe validation', async () => {
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
      disableRules: ['jsonld/adobe/required-missing'],
      runtime: { jsonldAdobe: { enabled: true } },
    }).validate([{ type: 'jsonld', source: '', data: [{ '@context': 'https://schema.org', '@type': 'Product' }] }]);

    expect(validateSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      {
        type: 'jsonld',
        source: '',
        diagnostics: [],
      },
    ]);
  });
});
