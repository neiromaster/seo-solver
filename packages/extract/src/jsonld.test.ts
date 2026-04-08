import { describe, expect, test } from 'vitest';
import { ExtractionError, extractJsonLd, JsonLdExtractor } from './index.js';
import { htmlToMinimalFetchResult } from './pipeline.js';
import { readFixture } from './test-support/fixtures.js';

describe('JsonLdExtractor', () => {
  test('extracts valid blocks', () => {
    const result = extractJsonLd(readFixture('full-seo.html'));
    expect(result).toEqual([
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        name: 'A & B',
      },
    ]);
  });

  test('preserves top-level array blocks as a single entry', () => {
    const html =
      '<html><head><script type="application/ld+json">[{"@type":"Thing"},{"@type":"Person"}]</script></head></html>';
    const result = extractJsonLd(html);
    expect(result).toEqual([[{ '@type': 'Thing' }, { '@type': 'Person' }]]);
  });

  test('skips invalid blocks and keeps warnings', () => {
    const result = new JsonLdExtractor().extract(htmlToMinimalFetchResult(readFixture('multiple-jsonld.html'), 'html'));
    expect(result?.data).toHaveLength(2);
    expect(result?.warnings).toHaveLength(1);
  });

  test('returns empty data with warnings when all blocks are invalid', () => {
    const result = new JsonLdExtractor().extract(htmlToMinimalFetchResult(readFixture('broken-jsonld.html'), 'html'));
    expect(result?.data).toEqual([]);
    expect(result?.warnings).toHaveLength(2);
  });

  test('throws when configured with onError throw', () => {
    const extractor = new JsonLdExtractor({ onError: 'throw' });
    expect(() => extractor.extract(htmlToMinimalFetchResult(readFixture('broken-jsonld.html'), 'html'))).toThrow(
      ExtractionError,
    );
  });

  test('includes null envelope when configured with onError include', () => {
    const extractor = new JsonLdExtractor({ onError: 'include' });
    const result = extractor.extract(htmlToMinimalFetchResult(readFixture('broken-jsonld.html'), 'html'));
    expect(result?.data).toBeNull();
    expect(result?.warnings).toHaveLength(2);
  });
});
