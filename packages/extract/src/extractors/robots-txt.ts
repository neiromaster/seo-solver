import type { ResourceType } from '@seo-solver/types';
import type { ExtractionEnvelope, ExtractionWarning, RobotsTxtData, RobotsTxtGroup } from '@seo-solver/types/extract';
import type { FetchResult } from '@seo-solver/types/fetch';
import { stripBom, trimTrailingInlineComment } from '../utils/normalize.js';

export class RobotsTxtExtractor {
  readonly type = 'robots-txt';
  readonly accepts: ResourceType[] = ['robots-txt'];

  extract(input: FetchResult): ExtractionEnvelope<RobotsTxtData> | null {
    if (input.resourceType !== 'robots-txt') {
      return null;
    }

    const warnings: ExtractionWarning[] = [];
    const lines = stripBom(input.body).split(/\r?\n/);
    const groups: RobotsTxtGroup[] = [];
    const sitemaps: string[] = [];
    let crawlDelay: number | null = null;
    let currentGroup: RobotsTxtGroup | null = null;
    let currentGroupHasRules = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === '' || trimmed.startsWith('#')) {
        currentGroup = trimmed === '' ? null : currentGroup;
        currentGroupHasRules = trimmed === '' ? false : currentGroupHasRules;
        continue;
      }

      const separatorIndex = trimmed.indexOf(':');
      if (separatorIndex === -1) {
        continue;
      }

      const directive = trimmed.slice(0, separatorIndex).trim().toLowerCase();
      const rawValue = trimmed.slice(separatorIndex + 1);
      const value = trimTrailingInlineComment(rawValue);

      if (directive === 'user-agent') {
        if (!currentGroup || currentGroupHasRules) {
          currentGroup = { userAgents: [], allow: [], disallow: [] };
          groups.push(currentGroup);
          currentGroupHasRules = false;
        }

        currentGroup.userAgents.push(value);
        continue;
      }

      if (directive === 'sitemap') {
        if (value !== '') {
          sitemaps.push(value);
        }
        continue;
      }

      if (!currentGroup) {
        continue;
      }

      if (directive === 'allow') {
        currentGroup.allow.push(value);
        currentGroupHasRules = true;
        continue;
      }

      if (directive === 'disallow') {
        currentGroup.disallow.push(value);
        currentGroupHasRules = true;
        continue;
      }

      if (directive === 'crawl-delay') {
        currentGroupHasRules = true;
        if (value === '') {
          crawlDelay = null;
          warnings.push({ message: 'Invalid crawl-delay value', location: directive });
          continue;
        }

        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
          crawlDelay = parsed;
        } else {
          crawlDelay = null;
          warnings.push({ message: 'Invalid crawl-delay value', location: directive });
        }
      }
    }

    return {
      type: this.type,
      source: input.url,
      data: {
        groups,
        sitemaps,
        crawlDelay,
      },
      raw: input.body,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
}
