import type { ExtractedPage } from '@seo-solver/types/extract';
import { describe, expect, test } from 'vitest';
import { getTargetData, getTargetStatus, hasTargetData } from './status.js';

const page: ExtractedPage = {
  source: {
    requestUrl: 'https://example.com/',
    url: 'https://example.com/',
    statusCode: 200,
    resourceType: 'html',
    redirects: [],
    timing: 12,
    attempts: 1,
    fetchedAt: '2026-04-22T00:00:00.000Z',
  },
  data: {
    meta: {
      title: 'Example',
      charset: 'utf-8',
      name: {},
      httpEquiv: {},
      lang: 'en',
      itemprop: {},
    },
    opengraph: null,
  },
  targetStatus: {
    meta: 'present',
    opengraph: 'missing',
  },
  errors: [],
};

describe('ExtractedPage target helpers', () => {
  test('returns typed data for a present target', () => {
    expect(getTargetData(page, 'meta')).toEqual(page.data.meta);
    expect(getTargetStatus(page, 'meta')).toBe('present');
    expect(hasTargetData(page, 'meta')).toBe(true);
  });

  test('returns null and missing status for a selected target without data', () => {
    expect(getTargetData(page, 'opengraph')).toBeNull();
    expect(getTargetStatus(page, 'opengraph')).toBe('missing');
    expect(hasTargetData(page, 'opengraph')).toBe(false);
  });

  test('returns null and undefined status for an unselected target', () => {
    expect(getTargetData(page, 'headings')).toBeNull();
    expect(getTargetStatus(page, 'headings')).toBeUndefined();
    expect(hasTargetData(page, 'headings')).toBe(false);
  });
});
