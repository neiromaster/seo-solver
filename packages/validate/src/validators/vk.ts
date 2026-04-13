import type { MetaTagsData, OpenGraphData } from '@seo-solver/types/extract';
import type { ExtractionEnvelope } from '@seo-solver/types/extract-advanced';
import { createRuleCatalog, type RuleDefinition, runRules } from '../utils/rules.js';

type VKValidationData = Record<string, never>;

export class VKValidator {
  readonly type = '*';

  readonly rules: readonly RuleDefinition<VKValidationData>[] = [
    {
      id: 'vk/image-present',
      severity: 'info',
      message: 'vk:image is present',
      check: (_data, context) => (getMetaVkImage(context) || getOpenGraphVkImage(context) ? {} : null),
    },
  ];

  async validate(
    envelope: ExtractionEnvelope,
    context?: ExtractionEnvelope[],
    options?: { isRuleEnabled?: (ruleId: string) => boolean },
  ) {
    const syntheticEnvelope: ExtractionEnvelope<VKValidationData> = {
      type: this.type,
      source: envelope.source,
      data: {},
    };

    return runRules(syntheticEnvelope, context, this.rules, options);
  }
}

export const vkRuleCatalog = createRuleCatalog('*', new VKValidator().rules);

function getMetaVkImage(context: ExtractionEnvelope[] | undefined): string | null {
  const envelope = context?.find((entry): entry is ExtractionEnvelope<MetaTagsData> => entry.type === 'meta');
  const value = envelope?.data.name['vk:image'];
  return value && value !== '' ? value : null;
}

function getOpenGraphVkImage(context: ExtractionEnvelope[] | undefined): string | null {
  const envelope = context?.find((entry): entry is ExtractionEnvelope<OpenGraphData> => entry.type === 'opengraph');
  if (!envelope) {
    return null;
  }

  const value = envelope.data['vk:image'];
  if (typeof value === 'string') {
    return value || null;
  }

  return Array.isArray(value) ? (value.find((entry) => entry !== '') ?? null) : null;
}
