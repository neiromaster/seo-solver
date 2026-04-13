import type { CanonicalData, MetaTagsData, OpenGraphData } from '@seo-solver/types/extract';
import type { ExtractionEnvelope } from '@seo-solver/types/extract-advanced';
import { createRuleCatalog, type RuleDefinition, runRules } from '../utils/rules';
import { isAbsoluteUrl } from '../utils/url';

const TITLE_LIMIT = 90;
const DESCRIPTION_LIMIT = 200;
const WHATSAPP_MIN_WIDTH = 300;
const WHATSAPP_MIN_HEIGHT = 200;
const VALID_OG_TYPES = new Set([
  'website',
  'article',
  'profile',
  'book',
  'video.movie',
  'video.episode',
  'video.tv_show',
  'video.other',
  'music.song',
  'music.album',
  'music.playlist',
  'music.radio_station',
  'product',
]);
const OG_LOCALE_FORMAT = /^[a-z]{2}_[A-Z]{2}$/;

export class OpenGraphValidator {
  readonly type = 'opengraph';

  readonly rules: readonly RuleDefinition<OpenGraphData>[] = [
    {
      id: 'opengraph/title-missing',
      severity: 'error',
      message: 'og:title is required for social sharing',
      check: (data) => (isMissingValue(data['og:title']) ? {} : null),
    },
    {
      id: 'opengraph/title-too-long',
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
      id: 'opengraph/title-mismatch-meta',
      severity: 'info',
      message: 'og:title differs substantially from the document title',
      check: (data, context) => {
        const ogTitle = getFirstValue(data['og:title']);
        const metaTitle = findMetaEnvelope(context)?.data.title;
        if (!ogTitle || !metaTitle) {
          return null;
        }

        const normalizedOgTitle = normalizeComparisonValue(ogTitle);
        const normalizedMetaTitle = normalizeComparisonValue(metaTitle);
        if (
          normalizedOgTitle.length === 0 ||
          normalizedMetaTitle.length === 0 ||
          normalizedOgTitle.includes(normalizedMetaTitle) ||
          normalizedMetaTitle.includes(normalizedOgTitle)
        ) {
          return null;
        }

        return {
          path: 'og:title',
          expected: metaTitle,
          actual: ogTitle,
          message: 'og:title differs substantially from <title>',
        };
      },
    },
    {
      id: 'opengraph/description-missing',
      severity: 'warning',
      message: 'og:description is recommended for social sharing',
      check: (data) => (isMissingValue(data['og:description']) ? {} : null),
    },
    {
      id: 'opengraph/description-too-long',
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
      id: 'opengraph/description-fallback-missing',
      severity: 'warning',
      message: 'Neither og:description nor meta description is present',
      check: (data, context) => {
        if (!isMissingValue(data['og:description'])) {
          return null;
        }

        const metaDescription = findMetaEnvelope(context)?.data.name.description;
        return metaDescription ? null : {};
      },
    },
    {
      id: 'opengraph/image-missing',
      severity: 'warning',
      message: 'og:image is recommended for social sharing',
      check: (data) => (isMissingValue(data['og:image']) ? {} : null),
    },
    {
      id: 'opengraph/image-not-absolute',
      severity: 'warning',
      message: 'og:image should be an absolute URL',
      check: (data) => absoluteUrlResults(data['og:image'], 'og:image', 'og:image should be an absolute URL'),
    },
    {
      id: 'opengraph/image-http',
      severity: 'warning',
      message: 'og:image uses HTTP; Telegram and WhatsApp may not load it',
      check: (data) =>
        protocolResults(
          data['og:image'],
          'og:image',
          'http:',
          'og:image uses HTTP; Telegram and WhatsApp may not load it',
        ),
    },
    {
      id: 'opengraph/image-missing-dimensions',
      severity: 'info',
      message: 'og:image is missing width or height metadata',
      check: (data) =>
        hasAnyValue(data['og:image']) && (!hasAnyValue(data['og:image:width']) || !hasAnyValue(data['og:image:height']))
          ? {}
          : null,
    },
    {
      id: 'opengraph/image-missing-alt',
      severity: 'info',
      message: 'og:image:alt is missing',
      check: (data) => (hasAnyValue(data['og:image']) && !hasAnyValue(data['og:image:alt']) ? {} : null),
    },
    {
      id: 'opengraph/image-avif',
      severity: 'warning',
      message: 'og:image:type is image/avif, which Facebook does not reliably support',
      check: (data) =>
        getValues(data['og:image:type']).some((entry) => entry.toLowerCase() === 'image/avif') ? {} : null,
    },
    {
      id: 'opengraph/image-whatsapp-minimum',
      severity: 'info',
      message: 'og:image dimensions are below WhatsApp minimum recommendations',
      check: (data) => {
        const width = parsePositiveNumber(getFirstValue(data['og:image:width']));
        const height = parsePositiveNumber(getFirstValue(data['og:image:height']));
        if (width === null || height === null) {
          return null;
        }

        return width < WHATSAPP_MIN_WIDTH || height < WHATSAPP_MIN_HEIGHT
          ? {
              expected: `${WHATSAPP_MIN_WIDTH}x${WHATSAPP_MIN_HEIGHT}`,
              actual: `${width}x${height}`,
            }
          : null;
      },
    },
    {
      id: 'opengraph/url-missing',
      severity: 'warning',
      message: 'og:url is recommended',
      check: (data) => (isMissingValue(data['og:url']) ? {} : null),
    },
    {
      id: 'opengraph/url-not-absolute',
      severity: 'warning',
      message: 'og:url should be an absolute URL',
      check: (data) => absoluteUrlResults(data['og:url'], 'og:url', 'og:url should be an absolute URL'),
    },
    {
      id: 'opengraph/url-mismatch-canonical',
      severity: 'warning',
      message: 'og:url does not match the canonical URL',
      check: (data, context) => {
        const ogUrl = getFirstValue(data['og:url']);
        const canonical = findCanonicalEnvelope(context)?.data.canonical;
        if (!ogUrl || canonical === null || canonical === undefined || ogUrl === canonical) {
          return null;
        }

        return {
          path: 'og:url',
          expected: canonical,
          actual: ogUrl,
        };
      },
    },
    {
      id: 'opengraph/type-missing',
      severity: 'info',
      message: "og:type defaults to 'website' when missing",
      check: (data) => (isMissingValue(data['og:type']) ? {} : null),
    },
    {
      id: 'opengraph/type-invalid',
      severity: 'warning',
      message: 'og:type is not a recognized Open Graph type',
      check: (data) => {
        const value = getFirstValue(data['og:type']);
        return value && !VALID_OG_TYPES.has(value) ? { path: 'og:type', actual: value } : null;
      },
    },
    {
      id: 'opengraph/locale-invalid-format',
      severity: 'warning',
      message: 'og:locale should use the xx_XX format',
      check: (data) => {
        const value = getFirstValue(data['og:locale']);
        return value && !OG_LOCALE_FORMAT.test(value) ? { path: 'og:locale', actual: value } : null;
      },
    },
    {
      id: 'opengraph/locale-mismatch-lang',
      severity: 'warning',
      message: 'og:locale does not match the page language',
      check: (data, context) => {
        const locale = getFirstValue(data['og:locale']);
        const lang = findMetaEnvelope(context)?.data.lang;
        if (!locale || !lang) {
          return null;
        }

        const localePrefix = normalizeLanguageTag(locale);
        const langPrefix = normalizeLanguageTag(lang);
        return localePrefix && langPrefix && localePrefix !== langPrefix
          ? { path: 'og:locale', expected: lang, actual: locale }
          : null;
      },
    },
    {
      id: 'opengraph/locale-alternate-mismatch-hreflang',
      severity: 'info',
      message: 'og:locale alternate values do not cover all hreflang languages',
      check: (data, context) => {
        const canonicalEnvelope = findCanonicalEnvelope(context);
        if (!canonicalEnvelope || canonicalEnvelope.data.hreflang.length === 0) {
          return null;
        }

        const ogLocales = [getFirstValue(data['og:locale']), ...getValues(data['og:locale:alternate'])]
          .map((entry) => normalizeLanguageTag(entry))
          .filter((entry): entry is string => entry !== null && entry !== '');
        if (ogLocales.length === 0) {
          return null;
        }

        const missing = canonicalEnvelope.data.hreflang
          .map((entry) => entry.lang)
          .filter((entry) => entry.toLowerCase() !== 'x-default')
          .map((entry) => normalizeLanguageTag(entry))
          .filter((entry): entry is string => entry !== null && entry !== '')
          .filter((entry) => !ogLocales.includes(entry));

        return missing.length > 0
          ? {
              expected: canonicalEnvelope.data.hreflang.map((entry) => entry.lang),
              actual: [getFirstValue(data['og:locale']), ...getValues(data['og:locale:alternate'])].filter(Boolean),
              message: `og:locale coverage is missing hreflang languages: ${missing.join(', ')}`,
            }
          : null;
      },
    },
    {
      id: 'opengraph/article-missing-published-time',
      severity: 'info',
      message: 'article:published_time is recommended for article pages',
      check: (data) =>
        getFirstValue(data['og:type']) === 'article' && !hasAnyValue(data['article:published_time']) ? {} : null,
    },
    {
      id: 'opengraph/article-invalid-time-format',
      severity: 'warning',
      message: 'Article timestamps should use ISO 8601 format',
      check: (data) => {
        if (getFirstValue(data['og:type']) !== 'article') {
          return null;
        }

        const diagnostics = ['article:published_time', 'article:modified_time']
          .map((key) => ({ key, value: getFirstValue(data[key]) }))
          .filter(({ value }) => value && !isIso8601(value))
          .map(({ key, value }) => ({ path: key, actual: value }));

        return diagnostics.length > 0 ? diagnostics : null;
      },
    },
    {
      id: 'opengraph/article-modified-before-published',
      severity: 'warning',
      message: 'article:modified_time is earlier than article:published_time',
      check: (data) => {
        if (getFirstValue(data['og:type']) !== 'article') {
          return null;
        }

        const published = parseIsoDate(getFirstValue(data['article:published_time']));
        const modified = parseIsoDate(getFirstValue(data['article:modified_time']));
        if (!published || !modified || modified >= published) {
          return null;
        }

        return {
          expected: getFirstValue(data['article:published_time']),
          actual: getFirstValue(data['article:modified_time']),
        };
      },
    },
    {
      id: 'opengraph/video-missing-url',
      severity: 'warning',
      message: 'og:video:url is required for video Open Graph objects',
      check: (data) => (isVideoType(getFirstValue(data['og:type'])) && !hasAnyValue(data['og:video:url']) ? {} : null),
    },
    {
      id: 'opengraph/video-missing-dimensions',
      severity: 'info',
      message: 'og:video is missing width or height metadata',
      check: (data) =>
        isVideoType(getFirstValue(data['og:type'])) &&
        (!hasAnyValue(data['og:video:width']) || !hasAnyValue(data['og:video:height']))
          ? {}
          : null,
    },
  ];

  async validate(
    envelope: ExtractionEnvelope<OpenGraphData>,
    context?: ExtractionEnvelope[],
    options?: { isRuleEnabled?: (ruleId: string) => boolean },
  ): Promise<ReturnType<typeof runRules<OpenGraphData>>> {
    return runRules(envelope, context, this.rules, options);
  }
}

export const openGraphRuleCatalog = createRuleCatalog('opengraph', new OpenGraphValidator().rules);

function getValues(value: string | string[] | undefined): string[] {
  if (value === undefined) {
    return [];
  }

  return (Array.isArray(value) ? value : [value]).filter((entry) => entry !== '');
}

function getFirstValue(value: string | string[] | undefined): string | null {
  return getValues(value)[0] ?? null;
}

function hasAnyValue(value: string | string[] | undefined): boolean {
  return getValues(value).length > 0;
}

function isMissingValue(value: string | string[] | undefined): boolean {
  return !hasAnyValue(value);
}

function lengthResults(value: string | string[] | undefined, key: string, limit: number, template: string) {
  const diagnostics = getValues(value)
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
  const diagnostics = getValues(value)
    .map((entry, index, list) => ({ entry, index, list }))
    .filter(({ entry }) => !isAbsoluteUrl(entry))
    .map(({ entry, index, list }) => ({
      path: list.length > 1 ? `${key}[${index}]` : key,
      actual: entry,
      message,
    }));

  return diagnostics.length > 0 ? diagnostics : null;
}

function protocolResults(value: string | string[] | undefined, key: string, protocol: string, message: string) {
  const diagnostics = getValues(value)
    .map((entry, index, list) => ({ entry, index, list }))
    .filter(({ entry }) => {
      try {
        return new URL(entry).protocol === protocol;
      } catch {
        return false;
      }
    })
    .map(({ entry, index, list }) => ({
      path: list.length > 1 ? `${key}[${index}]` : key,
      actual: entry,
      message,
    }));

  return diagnostics.length > 0 ? diagnostics : null;
}

function normalizeComparisonValue(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeLanguageTag(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().replace('_', '-').toLowerCase();
  return normalized.split('-')[0] || null;
}

function isIso8601(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?)?$/.test(value);
}

function parseIsoDate(value: string | null): number | null {
  if (!value || !isIso8601(value)) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function parsePositiveNumber(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function isVideoType(value: string | null): boolean {
  return value?.startsWith('video.') ?? false;
}

function findMetaEnvelope(context: ExtractionEnvelope[] | undefined): ExtractionEnvelope<MetaTagsData> | undefined {
  return context?.find((entry): entry is ExtractionEnvelope<MetaTagsData> => entry.type === 'meta');
}

function findCanonicalEnvelope(
  context: ExtractionEnvelope[] | undefined,
): ExtractionEnvelope<CanonicalData> | undefined {
  return context?.find((entry): entry is ExtractionEnvelope<CanonicalData> => entry.type === 'canonical');
}
