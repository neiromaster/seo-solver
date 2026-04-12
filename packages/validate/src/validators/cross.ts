import type { ExtractionEnvelope, JsonLdData, MetaTagsData, OpenGraphData } from '@seo-solver/types/extract';
import { createRuleCatalog, type RuleDefinition, runRules } from '../utils/rules.js';

type CrossValidationData = Record<string, never>;

export class CrossValidator {
  readonly type = '*';

  readonly rules: readonly RuleDefinition<CrossValidationData>[] = [
    {
      id: 'cross/noindex-with-seo',
      severity: 'info',
      message: 'The page is noindex but still includes SEO/social metadata',
      check: (_data, context) => {
        const meta = findMetaEnvelope(context);
        if (!meta) {
          return null;
        }

        const robots = meta.data.name.robots?.toLowerCase() ?? '';
        if (!robots.includes('noindex')) {
          return null;
        }

        return hasSeoSignals(context) ? {} : null;
      },
    },
    {
      id: 'cross/og-type-content-mismatch',
      severity: 'info',
      message: 'og:type is website even though article metadata is present',
      check: (_data, context) => {
        const og = findOpenGraphEnvelope(context);
        if (!og) {
          return null;
        }

        return getOpenGraphValue(og.data, 'og:type') === 'website' &&
          getOpenGraphValue(og.data, 'article:published_time')
          ? {}
          : null;
      },
    },
  ];

  async validate(
    envelope: ExtractionEnvelope,
    context?: ExtractionEnvelope[],
    options?: { isRuleEnabled?: (ruleId: string) => boolean },
  ) {
    const syntheticEnvelope: ExtractionEnvelope<CrossValidationData> = {
      type: this.type,
      source: envelope.source,
      data: {},
    };
    return runRules(syntheticEnvelope, context, this.rules, options);
  }
}

export const crossRuleCatalog = createRuleCatalog('*', new CrossValidator().rules);

function findMetaEnvelope(context: ExtractionEnvelope[] | undefined): ExtractionEnvelope<MetaTagsData> | undefined {
  return context?.find((entry): entry is ExtractionEnvelope<MetaTagsData> => entry.type === 'meta');
}

function findOpenGraphEnvelope(
  context: ExtractionEnvelope[] | undefined,
): ExtractionEnvelope<OpenGraphData> | undefined {
  return context?.find((entry): entry is ExtractionEnvelope<OpenGraphData> => entry.type === 'opengraph');
}

function findJsonLdEnvelope(context: ExtractionEnvelope[] | undefined): ExtractionEnvelope<JsonLdData> | undefined {
  return context?.find((entry): entry is ExtractionEnvelope<JsonLdData> => entry.type === 'jsonld');
}

function hasSeoSignals(context: ExtractionEnvelope[] | undefined): boolean {
  const og = findOpenGraphEnvelope(context);
  const jsonld = findJsonLdEnvelope(context);
  const meta = findMetaEnvelope(context);
  const canonical = context?.find((entry) => entry.type === 'canonical' && entry.data !== null);

  return Boolean(
    (og && Object.keys(og.data).length > 0) ||
      (jsonld && jsonld.data.length > 0) ||
      hasMetaSeoSignals(meta?.data) ||
      (canonical && typeof canonical.data === 'object'),
  );
}

function hasMetaSeoSignals(data: MetaTagsData | undefined): boolean {
  if (!data) {
    return false;
  }

  return (
    Object.keys(data.itemprop).length > 0 ||
    Object.keys(data.name).some(
      (key) =>
        key.startsWith('twitter:') || key.startsWith('pinterest') || key.startsWith('vk:') || key === 'description',
    )
  );
}

function getOpenGraphValue(data: OpenGraphData, key: string): string | null {
  const value = data[key];
  if (typeof value === 'string') {
    return value || null;
  }

  return Array.isArray(value) ? (value.find((entry) => entry !== '') ?? null) : null;
}
