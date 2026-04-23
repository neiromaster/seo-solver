import { describe, expect, test } from 'vitest';
import { htmlToMinimalFetchResult } from '../../api/html-input.js';
import { extractOpenGraph } from '../../index.js';
import { readFixture } from '../../test-support/fixtures.js';
import { OpenGraphExtractor } from './opengraph.js';

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

  test('extracts app links and vk property namespaces', () => {
    const result = extractOpenGraph(
      '<html><head><meta property="og:title" content="Title"><meta property="al:ios:url" content="example://page"><meta property="al:android:package" content="com.example.app"><meta property="vk:image" content="https://example.com/vk.jpg"></head></html>',
    );

    expect(result).toEqual({
      'og:title': 'Title',
      'al:ios:url': 'example://page',
      'al:android:package': 'com.example.app',
      'vk:image': 'https://example.com/vk.jpg',
    });
  });

  test('supports vk name fallback in addition to property extraction', () => {
    const result = extractOpenGraph(
      '<html><head><meta name="vk:image" content="https://example.com/name-vk.jpg"></head></html>',
    );
    expect(result?.['vk:image']).toBe('https://example.com/name-vk.jpg');
  });
});
