import { describe, expect, test } from 'vitest';
import { extractOpenGraph, OpenGraphExtractor } from './index.js';
import { htmlToMinimalFetchResult } from './pipeline.js';
import { readFixture } from './test-support/fixtures.js';

describe('OpenGraphExtractor', () => {
  test('extracts opengraph and namespace tags', () => {
    const result = new OpenGraphExtractor().extract(htmlToMinimalFetchResult(readFixture('full-seo.html'), 'html'));
    expect(result?.data['og:title']).toBe('My Article');
    expect(result?.data['article:author']).toBe('John Doe');
    expect(result?.raw).toContain('og:title');
  });

  test('preserves duplicate property order', () => {
    const result = extractOpenGraph(readFixture('duplicate-og.html'));
    expect(result?.['og:title']).toEqual(['First', 'Second']);
    expect(result?.['og:image']).toEqual(['https://example.com/1.jpg', 'https://example.com/2.jpg']);
    expect(result?.['og:image:width']).toEqual(['1200', '800']);
  });

  test('uses property over name and supports name fallback', () => {
    const result = extractOpenGraph(readFixture('og-name-vs-property.html'));
    expect(result?.['og:title']).toEqual(['From name', 'From property']);
  });

  test('returns null when no tags exist', () => {
    expect(extractOpenGraph(readFixture('minimal.html'))).toBeNull();
  });

  test('extracts from body when head is missing', () => {
    expect(extractOpenGraph(readFixture('no-head.html'))?.['og:title']).toBe('Body OG');
  });
});
