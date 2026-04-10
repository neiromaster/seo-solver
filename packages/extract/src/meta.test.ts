import { describe, expect, test } from 'vitest';
import { extractMetaTags } from './index.js';
import { readFixture } from './test-support/fixtures.js';

describe('MetaTagsExtractor', () => {
  test('extracts title, charset, names, and http-equiv', () => {
    const result = extractMetaTags(readFixture('full-seo.html'));
    expect(result?.title).toBe('My Page Example');
    expect(result?.charset).toBe('utf-8');
    expect(result?.lang).toBe('en');
    expect(result?.name.description).toBe('Page description here');
    expect(result?.name['twitter:card']).toBe('summary_large_image');
    expect(result?.itemprop).toEqual({});
  });

  test('extracts itemprop metadata from head', () => {
    const result = extractMetaTags(
      '<html lang="ru"><head><meta itemprop="name" content="Example"><meta itemprop="image" content="https://example.com/image.jpg"></head></html>',
    );

    expect(result?.lang).toBe('ru');
    expect(result?.itemprop).toEqual({
      name: 'Example',
      image: 'https://example.com/image.jpg',
    });
  });

  test('normalizes name keys to lowercase and keeps last value', () => {
    const html =
      '<html><head><meta name="Description" content="first"><meta name="description" content="last"></head></html>';
    expect(extractMetaTags(html)?.name.description).toBe('last');
  });

  test('does not include og fallback tags in meta output', () => {
    expect(extractMetaTags(readFixture('og-name-vs-property.html'))).toEqual({
      title: null,
      charset: null,
      name: {},
      httpEquiv: {},
      lang: 'en',
      itemprop: {},
    });
  });

  test('returns null for empty html', () => {
    expect(extractMetaTags(readFixture('empty.html'))).toBeNull();
  });
});
