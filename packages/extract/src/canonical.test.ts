import { describe, expect, test } from 'vitest';
import { CanonicalExtractor, extractCanonical } from './index.js';
import { htmlToMinimalFetchResult } from './pipeline.js';
import { readFixture } from './test-support/fixtures.js';

describe('CanonicalExtractor', () => {
  test('extracts canonical and hreflang links', () => {
    const result = extractCanonical(readFixture('full-seo.html'));
    expect(result?.canonical).toBe('https://example.com/article');
    expect(result?.hreflang).toEqual([
      { lang: 'en', href: 'https://example.com/en/article' },
      { lang: 'x-default', href: 'https://example.com/article' },
    ]);
  });

  test('returns empty shape when canonical is absent', () => {
    expect(extractCanonical(readFixture('minimal.html'))).toBeNull();
  });

  test('warns on multiple canonical tags', () => {
    const html = '<link rel="canonical" href="/first"><link rel="canonical" href="/second">';
    const result = new CanonicalExtractor().extract(htmlToMinimalFetchResult(html, 'html'));
    expect(result?.data.canonical).toBe('/first');
    expect(result?.warnings).toHaveLength(1);
  });
});
