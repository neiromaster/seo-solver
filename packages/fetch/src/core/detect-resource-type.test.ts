import { describe, expect, test } from 'vitest';
import { detectResourceType } from './detect-resource-type.js';

describe('detectResourceType', () => {
  test.each([
    ['https://x.com/robots.txt', 'text/plain', 'robots-txt'],
    ['https://x.com/robots.txt', 'text/html', 'robots-txt'],
    ['https://x.com/robots.txt?v=2', null, 'robots-txt'],
    ['https://x.com/sitemap.xml', 'application/xml', 'sitemap-xml'],
    ['https://x.com/sitemap_index.xml', null, 'sitemap-xml'],
    ['https://x.com/', 'text/html; charset=utf-8', 'html'],
    ['https://x.com/page', 'application/xhtml+xml', 'html'],
    ['https://x.com/api', 'application/json', 'json'],
    ['https://x.com/ld', 'application/ld+json', 'json'],
    ['https://x.com/data.json', null, 'json'],
    ['https://x.com/page.html', null, 'html'],
    ['https://x.com/file.zip', null, 'binary'],
    ['https://x.com/file', 'application/octet-stream', 'binary'],
    ['https://x.com/file', null, 'binary'],
    ['not-a-url', 'text/html', 'html'],
  ])('detects %s with %s as %s', (url, contentType, expected) => {
    expect(detectResourceType(url, contentType)).toBe(expected);
  });
});
