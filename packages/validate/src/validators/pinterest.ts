import type { MetaTagsData, OpenGraphData } from '@seo-solver/types/extract';
import type { ExtractionEnvelope } from '@seo-solver/types/extract-advanced';
import { createRuleCatalog, type RuleDefinition, runRules } from '../utils/rules.js';

export class PinterestValidator {
  readonly type = 'meta';

  readonly rules: readonly RuleDefinition<MetaTagsData>[] = [
    {
      id: 'pinterest/nopin-detected',
      severity: 'info',
      message: 'Pinterest pinning is disabled with the nopin directive',
      check: (data) => (data.name.pinterest?.toLowerCase() === 'nopin' ? {} : null),
    },
    {
      id: 'pinterest/og-image-vertical-recommended',
      severity: 'info',
      message: 'Pinterest recommends a dedicated vertical image when og:image is used',
      check: (data, context) => (!data.name['pinterest:media'] && getOpenGraphValue(context, 'og:image') ? {} : null),
    },
  ];

  async validate(
    envelope: ExtractionEnvelope<MetaTagsData>,
    context?: ExtractionEnvelope[],
    options?: { isRuleEnabled?: (ruleId: string) => boolean },
  ) {
    return runRules(envelope, context, this.rules, options);
  }
}

export const pinterestRuleCatalog = createRuleCatalog('meta', new PinterestValidator().rules);

function getOpenGraphValue(context: ExtractionEnvelope[] | undefined, key: string): string | null {
  const envelope = context?.find((entry): entry is ExtractionEnvelope<OpenGraphData> => entry.type === 'opengraph');
  if (!envelope) {
    return null;
  }

  const value = envelope.data[key];
  if (typeof value === 'string') {
    return value || null;
  }

  return Array.isArray(value) ? (value.find((entry) => entry !== '') ?? null) : null;
}
