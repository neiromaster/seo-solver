import type { ExtractionEnvelope, OpenGraphData } from '@seo-solver/types';
import { createRuleCatalog, type RuleDefinition, runRules } from '../utils/rules.js';
import { isAbsoluteUrl } from '../utils/url.js';

const TITLE_LIMIT = 90;
const DESCRIPTION_LIMIT = 200;

export class OpenGraphValidator {
  readonly type = 'opengraph';

  readonly rules: readonly RuleDefinition<OpenGraphData>[] = [
    {
      id: 'og/title-missing',
      severity: 'error',
      message: 'og:title is required for social sharing',
      check: (data) => (isMissingValue(data['og:title']) ? {} : null),
    },
    {
      id: 'og/title-too-long',
      severity: 'warning',
      message: `og:title exceeds ${TITLE_LIMIT} characters`,
      check: (data) =>
        lengthResults(
          data['og:title'],
          'og:title',
          TITLE_LIMIT,
          'og:title exceeds {limit} characters (actual: {actual})',
        ),
    },
    {
      id: 'og/description-missing',
      severity: 'warning',
      message: 'og:description is recommended for social sharing',
      check: (data) => (isMissingValue(data['og:description']) ? {} : null),
    },
    {
      id: 'og/description-too-long',
      severity: 'warning',
      message: `og:description exceeds ${DESCRIPTION_LIMIT} characters`,
      check: (data) =>
        lengthResults(
          data['og:description'],
          'og:description',
          DESCRIPTION_LIMIT,
          'og:description exceeds {limit} characters (actual: {actual})',
        ),
    },
    {
      id: 'og/image-missing',
      severity: 'warning',
      message: 'og:image is recommended for social sharing',
      check: (data) => (isMissingValue(data['og:image']) ? {} : null),
    },
    {
      id: 'og/image-not-absolute',
      severity: 'warning',
      message: 'og:image should be an absolute URL',
      check: (data) => absoluteUrlResults(data['og:image'], 'og:image', 'og:image should be an absolute URL'),
    },
    {
      id: 'og/url-missing',
      severity: 'warning',
      message: 'og:url is recommended',
      check: (data) => (isMissingValue(data['og:url']) ? {} : null),
    },
    {
      id: 'og/url-not-absolute',
      severity: 'warning',
      message: 'og:url should be an absolute URL',
      check: (data) => absoluteUrlResults(data['og:url'], 'og:url', 'og:url should be an absolute URL'),
    },
    {
      id: 'og/type-missing',
      severity: 'info',
      message: "og:type defaults to 'website' when missing",
      check: (data) => (isMissingValue(data['og:type']) ? {} : null),
    },
  ];

  async validate(
    envelope: ExtractionEnvelope<OpenGraphData>,
    _context?: ExtractionEnvelope[],
    options?: { isRuleEnabled?: (ruleId: string) => boolean },
  ): Promise<ReturnType<typeof runRules<OpenGraphData>>> {
    return runRules(envelope, undefined, this.rules, options);
  }
}

export const openGraphRuleCatalog = createRuleCatalog('opengraph', new OpenGraphValidator().rules);

function normalizeValues(value: string | string[] | undefined): string[] {
  if (value === undefined) {
    return [];
  }

  return (Array.isArray(value) ? value : [value]).filter((entry) => entry !== '');
}

function isMissingValue(value: string | string[] | undefined): boolean {
  if (value === undefined) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.length === 0 || value.every((entry) => entry === '');
  }

  return value === '';
}

function lengthResults(value: string | string[] | undefined, key: string, limit: number, template: string) {
  const diagnostics = normalizeValues(value)
    .map((entry, index, list) => ({ entry, index, list }))
    .filter(({ entry }) => entry.length > limit)
    .map(({ entry, index, list }) => ({
      path: list.length > 1 ? `${key}[${index}]` : key,
      expected: limit,
      actual: entry.length,
      message: template.replace('{limit}', String(limit)).replace('{actual}', String(entry.length)),
    }));

  return diagnostics.length > 0 ? diagnostics : null;
}

function absoluteUrlResults(value: string | string[] | undefined, key: string, message: string) {
  const diagnostics = normalizeValues(value)
    .map((entry, index, list) => ({ entry, index, list }))
    .filter(({ entry }) => !isAbsoluteUrl(entry))
    .map(({ entry, index, list }) => ({
      path: list.length > 1 ? `${key}[${index}]` : key,
      actual: entry,
      message,
    }));

  return diagnostics.length > 0 ? diagnostics : null;
}
