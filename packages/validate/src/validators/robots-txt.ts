import type { ExtractionEnvelope, RobotsTxtData } from '@seo-solver/types';
import { createRuleCatalog, type RuleDefinition, runRules } from '../utils/rules.js';
import { isAbsoluteUrl } from '../utils/url.js';

export class RobotsTxtValidator {
  readonly type = 'robots-txt';

  readonly rules: readonly RuleDefinition<RobotsTxtData>[] = [
    {
      id: 'robots/empty-file',
      severity: 'info',
      message: 'robots.txt is empty',
      check: (data) => (data.groups.length === 0 && data.sitemaps.length === 0 ? {} : null),
    },
    {
      id: 'robots/no-wildcard-group',
      severity: 'info',
      message: 'No rules for User-agent: * (wildcard)',
      check: (data) => (data.groups.some((group) => group.userAgents.includes('*')) ? null : {}),
    },
    {
      id: 'robots/sitemap-missing',
      severity: 'warning',
      message: 'No Sitemap directive in robots.txt',
      check: (data) => (data.sitemaps.length === 0 ? {} : null),
    },
    {
      id: 'robots/sitemap-not-absolute',
      severity: 'warning',
      message: 'Sitemap URL should be absolute',
      check: (data) => {
        const diagnostics = data.sitemaps.flatMap((sitemap, index) =>
          !isAbsoluteUrl(sitemap) ? [{ path: `sitemaps[${index}]`, actual: sitemap }] : [],
        );
        return diagnostics.length > 0 ? diagnostics : null;
      },
    },
    {
      id: 'robots/disallow-all',
      severity: 'warning',
      message: 'All crawling is disallowed',
      check: (data) => {
        const diagnostics = data.groups.flatMap((group, index) =>
          group.disallow.includes('/') && group.allow.length === 0
            ? [
                {
                  path: `groups[${index}]`,
                  message: `All crawling is disallowed for ${group.userAgents.join(', ')}`,
                },
              ]
            : [],
        );

        return diagnostics.length > 0 ? diagnostics : null;
      },
    },
    {
      id: 'robots/crawl-delay-too-high',
      severity: 'info',
      message: 'Crawl-delay may slow indexing',
      check: (data) =>
        data.crawlDelay !== null && data.crawlDelay > 10
          ? { actual: data.crawlDelay, message: `Crawl-delay of ${data.crawlDelay}s may slow indexing` }
          : null,
    },
  ];

  async validate(
    envelope: ExtractionEnvelope<RobotsTxtData>,
    _context?: ExtractionEnvelope[],
    options?: { isRuleEnabled?: (ruleId: string) => boolean },
  ): Promise<ReturnType<typeof runRules<RobotsTxtData>>> {
    return runRules(envelope, undefined, this.rules, options);
  }
}

export const robotsTxtRuleCatalog = createRuleCatalog('robots-txt', new RobotsTxtValidator().rules);
