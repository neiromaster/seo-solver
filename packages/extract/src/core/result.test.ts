import type { ExtractionEnvelope } from '@seo-solver/types/extract-advanced';
import { describe, expect, test } from 'vitest';
import { htmlToMinimalFetchResult } from '../api/html-input.js';
import { toExtractedPage } from './result.js';

describe('toExtractedPage', () => {
  test('marks targets as missing when only report-style null envelopes exist', () => {
    const fetch = htmlToMinimalFetchResult('<!doctype html><html></html>', 'html');
    const envelopes: ExtractionEnvelope[] = [
      {
        type: 'opengraph',
        source: fetch.url,
        data: null,
        warnings: [{ message: 'boom' }],
      },
    ];

    const page = toExtractedPage(fetch, envelopes, ['opengraph']);

    expect(page.data).toEqual({ opengraph: null });
    expect(page.targetStatus).toEqual({ opengraph: 'missing' });
    expect(page.errors).toEqual([
      {
        extractor: 'opengraph',
        message: 'boom',
        path: undefined,
      },
    ]);
  });
});
