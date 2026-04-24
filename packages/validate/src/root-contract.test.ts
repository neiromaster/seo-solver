import type { ExtractedPage } from '@seo-solver/types/extract';
import { describe, expect, test } from 'vitest';
import { HeadingsValidator, MetaTagsValidator, RobotsTxtValidator } from './advanced.js';
import {
  isKnownRuleSelector,
  listRules,
  parseSeverityOverrides,
  validateHeadings,
  validateMetaTags,
  validatePage,
  validateRobotsTxt,
} from './index.js';

describe('root validate contract', () => {
  test('root rule tooling stays internally consistent for exact ids and wildcard selectors', () => {
    const rules = listRules();
    const ids = rules.map((entry) => entry.id);

    expect(ids).toContain('meta/title-missing');
    expect(ids).toContain('robots/section-missing');
    expect(isKnownRuleSelector('meta/title-missing')).toBe(true);
    expect(isKnownRuleSelector('meta/*')).toBe(true);
    expect(isKnownRuleSelector('robots/*')).toBe(true);
    expect(isKnownRuleSelector('totally-unknown/rule')).toBe(false);
    expect(parseSeverityOverrides(['meta/title-missing=error', 'meta/*=warning'])).toEqual({
      'meta/title-missing': 'error',
      'meta/*': 'warning',
    });
  });

  test('root direct helpers match advanced validator classes for representative inputs', async () => {
    const metaData = {
      title: null,
      charset: null,
      name: {},
      httpEquiv: {},
      lang: null,
      itemprop: {},
    };
    const headingsData = [
      { level: 2 as const, text: 'Section' },
      { level: 4 as const, text: '' },
    ];
    const robotsData = {
      groups: [{ userAgents: ['*'], allow: [], disallow: ['/'] }],
      sitemaps: ['/sitemap.xml'],
      crawlDelay: 15,
    };

    const [
      metaFromRoot,
      metaFromValidator,
      headingsFromRoot,
      headingsFromValidator,
      robotsFromRoot,
      robotsFromValidator,
    ] = await Promise.all([
      validateMetaTags(metaData),
      new MetaTagsValidator().validate({ type: 'meta', source: '', data: metaData }),
      validateHeadings(headingsData),
      new HeadingsValidator().validate({ type: 'headings', source: '', data: headingsData }),
      validateRobotsTxt(robotsData),
      new RobotsTxtValidator().validate({ type: 'robots-txt', source: '', data: robotsData }),
    ]);

    expect(metaFromRoot).toEqual(metaFromValidator);
    expect(headingsFromRoot).toEqual(headingsFromValidator);
    expect(robotsFromRoot).toEqual(robotsFromValidator);
  });

  test('validatePage preserves merged root behavior for mixed present, missing, and extractor-warning inputs', async () => {
    const page: ExtractedPage = {
      source: {
        requestUrl: 'https://example.com',
        url: 'https://example.com',
        statusCode: 200,
        resourceType: 'html',
        redirects: [],
        timing: 0,
        attempts: 1,
        fetchedAt: '2026-04-24T00:00:00.000Z',
      },
      data: {
        meta: {
          title: null,
          charset: 'utf-8',
          name: {},
          httpEquiv: {},
          lang: null,
          itemprop: {},
        },
        headings: null,
      },
      targetStatus: {
        meta: 'present',
        headings: 'missing',
      },
      errors: [
        {
          extractor: 'meta',
          message: 'Meta extraction warning',
          path: 'head > meta[0]',
        },
      ],
    };

    const report = await validatePage(page, {
      disableRules: ['meta/viewport-missing'],
      severityOverrides: { 'meta/description-missing': 'error' },
    });

    expect(report.validations).toEqual([
      {
        type: 'meta',
        source: 'https://example.com',
        diagnostics: [
          {
            severity: 'error',
            rule: 'extract/meta-warning',
            message: 'Meta extraction warning',
            path: 'head > meta[0]',
          },
          {
            severity: 'error',
            rule: 'meta/title-missing',
            message: '<title> tag is missing',
          },
          {
            severity: 'error',
            rule: 'meta/description-missing',
            message: 'Meta description is missing',
          },
        ],
      },
      {
        type: 'headings',
        source: 'https://example.com',
        diagnostics: [
          {
            severity: 'warning',
            rule: 'headings/section-missing',
            message: 'Headings section is missing',
          },
        ],
      },
    ]);
  });

  test('built-in validatePage no longer supports validator-level selection', async () => {
    const page: ExtractedPage = {
      source: {
        requestUrl: 'https://example.com',
        url: 'https://example.com',
        statusCode: 200,
        resourceType: 'html',
        redirects: [],
        timing: 0,
        attempts: 1,
        fetchedAt: '2026-04-24T00:00:00.000Z',
      },
      data: {
        meta: {
          title: null,
          charset: null,
          name: {},
          httpEquiv: {},
          lang: null,
          itemprop: {},
        },
        headings: [],
      },
      targetStatus: {
        meta: 'present',
        headings: 'present',
      },
      errors: [],
    };

    const report = await validatePage(page);
    expect(report.validations.map((entry) => entry.type).sort()).toEqual(['headings', 'meta']);
  });
});
