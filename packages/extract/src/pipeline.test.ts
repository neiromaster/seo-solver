import type { Extractor } from '@seo-solver/types/extract-advanced';
import { describe, expect, test, vi } from 'vitest';
import { ExtractionError } from './errors';
import * as parseHtmlModule from './parse-html';
import { createExtractorPipeline, extractAll, extractPage, htmlToMinimalFetchResult } from './pipeline';
import { readFixture } from './test-support/fixtures';

describe('createExtractorPipeline', () => {
  test('runs built-in html extractors by default', () => {
    const result = createExtractorPipeline().extract(htmlToMinimalFetchResult(readFixture('full-seo.html'), 'html'));
    expect(result.map((entry) => entry.type)).toEqual(['opengraph', 'jsonld', 'meta', 'headings', 'canonical']);
  });

  test('filters selected extractors', () => {
    const result = createExtractorPipeline({ targets: ['opengraph', 'jsonld'] }).extract(
      htmlToMinimalFetchResult(readFixture('full-seo.html'), 'html'),
    );
    expect(result.map((entry) => entry.type)).toEqual(['opengraph', 'jsonld']);
  });

  test('supports custom extractors', () => {
    const customExtractor: Extractor<Record<string, string>> = {
      type: 'custom',
      accepts: ['html'],
      extract: () => ({ type: 'custom', source: '', data: { key: 'value' } }),
    };

    const result = createExtractorPipeline({ targets: [customExtractor] }).extract(
      htmlToMinimalFetchResult(readFixture('full-seo.html'), 'html'),
    );

    expect(result).toEqual([{ type: 'custom', source: '', data: { key: 'value' } }]);
  });

  test('runs robots extractor for robots resources', () => {
    const result = createExtractorPipeline().extract(htmlToMinimalFetchResult(readFixture('robots.txt'), 'robots-txt'));
    expect(result.map((entry) => entry.type)).toEqual(['robots-txt']);
  });

  test('parses html once per extraction call', () => {
    const spy = vi.spyOn(parseHtmlModule, 'parseHtml');
    createExtractorPipeline().extract(htmlToMinimalFetchResult(readFixture('full-seo.html'), 'html'));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('includes errors when configured', () => {
    const badExtractor: Extractor = {
      type: 'bad',
      accepts: ['html'],
      extract: () => {
        throw new Error('boom');
      },
    };

    const result = createExtractorPipeline({ targets: [badExtractor], onError: 'report' }).extract(
      htmlToMinimalFetchResult(readFixture('full-seo.html'), 'html'),
    );
    expect(result).toEqual([{ type: 'bad', source: 'about:blank', data: null, warnings: [{ message: 'boom' }] }]);
  });

  test('skips extractor failures by default', () => {
    const badExtractor: Extractor = {
      type: 'bad',
      accepts: ['html'],
      extract: () => {
        throw new Error('boom');
      },
    };

    const result = createExtractorPipeline({ targets: [badExtractor] }).extract(
      htmlToMinimalFetchResult(readFixture('full-seo.html'), 'html'),
    );

    expect(result).toEqual([]);
  });

  test('throws extraction errors when configured', () => {
    const badExtractor: Extractor = {
      type: 'bad',
      accepts: ['html'],
      extract: () => {
        throw new Error('boom');
      },
    };

    expect(() =>
      createExtractorPipeline({ targets: [badExtractor], onError: 'throw' }).extract(
        htmlToMinimalFetchResult(readFixture('full-seo.html'), 'html'),
      ),
    ).toThrow(ExtractionError);
  });

  test('supports per-call extractor overrides', () => {
    const pipeline = createExtractorPipeline();
    const result = pipeline.extract(htmlToMinimalFetchResult(readFixture('full-seo.html'), 'html'), {
      targets: ['meta'],
    });

    expect(result.map((entry) => entry.type)).toEqual(['meta']);
  });

  test('returns empty results for unknown resource types', () => {
    const result = createExtractorPipeline().extract(htmlToMinimalFetchResult('abc', 'binary'));
    expect(result).toEqual([]);
  });

  test('returns no envelopes for empty html', () => {
    expect(extractAll(readFixture('empty.html'))).toEqual([]);
  });

  test('extractAll returns flattened envelopes', () => {
    expect(extractAll(readFixture('full-seo.html')).length).toBe(5);
  });

  test('extractPage returns structured package-owned result', () => {
    const result = extractPage(htmlToMinimalFetchResult(readFixture('full-seo.html'), 'html'));

    expect(result.source.resourceType).toBe('html');
    expect(result.data.canonical).not.toBeNull();
    expect(result.data.headings).not.toBeNull();
    expect(result.data.jsonld).not.toBeNull();
    expect(result.data.meta).not.toBeNull();
    expect(result.data.opengraph).not.toBeNull();
  });
});
