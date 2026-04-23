import type { RobotsTxtData } from '@seo-solver/types/extract';
import { describe, expect, test } from 'vitest';
import { extractRobotsText } from '../../api/extract-page.js';
import { htmlToMinimalFetchResult } from '../../api/html-input.js';
import { readFixture } from '../../test-support/fixtures.js';
import { RobotsTxtExtractor } from './robots-txt.js';

describe('RobotsTxtExtractor', () => {
  test('parses groups, sitemap, and crawl delay', () => {
    const result = extractRobotsText(readFixture('robots.txt'));
    const robotsData = result.data.robotsTxt as RobotsTxtData | undefined;
    expect(Object.keys(result.data)).toEqual(['robotsTxt']);
    expect(robotsData?.groups).toEqual([
      { userAgents: ['*'], allow: ['/'], disallow: ['/admin'] },
      { userAgents: ['Googlebot'], allow: [], disallow: ['/private'] },
    ]);
    expect(robotsData?.sitemaps).toEqual(['https://example.com/sitemap.xml']);
    expect(robotsData?.crawlDelay).toBe(10);
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
