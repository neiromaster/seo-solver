import { describe, expect, test } from 'vitest';
import { extractRobotsTxt, RobotsTxtExtractor } from './index.js';
import { htmlToMinimalFetchResult } from './pipeline.js';
import { readFixture } from './test-support/fixtures.js';

describe('RobotsTxtExtractor', () => {
  test('parses groups, sitemap, and crawl delay', () => {
    const result = extractRobotsTxt(readFixture('robots.txt'));
    expect(result?.groups).toEqual([
      { userAgents: ['*'], allow: ['/'], disallow: ['/admin'] },
      { userAgents: ['Googlebot'], allow: [], disallow: ['/private'] },
    ]);
    expect(result?.sitemaps).toEqual(['https://example.com/sitemap.xml']);
    expect(result?.crawlDelay).toBe(10);
  });

  test('handles bom and inline comments', () => {
    const result = new RobotsTxtExtractor().extract(
      htmlToMinimalFetchResult(readFixture('robots-edge-cases.txt'), 'robots-txt'),
    );
    expect(result?.data.groups[0]?.disallow).toEqual(['/admin']);
    expect(result?.warnings).toHaveLength(1);
  });

  test('returns null for non robots input', () => {
    const result = new RobotsTxtExtractor().extract(htmlToMinimalFetchResult('<html></html>', 'html'));
    expect(result).toBeNull();
  });
});
