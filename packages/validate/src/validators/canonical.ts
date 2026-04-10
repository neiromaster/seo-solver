import type { CanonicalData, ExtractionEnvelope, OpenGraphData } from '@seo-solver/types';
import { createRuleCatalog, type RuleDefinition, runRules } from '../utils/rules.js';
import { isAbsoluteUrl } from '../utils/url.js';

export class CanonicalValidator {
  readonly type = 'canonical';

  readonly rules: readonly RuleDefinition<CanonicalData>[] = [
    {
      id: 'canonical/missing',
      severity: 'warning',
      message: 'Canonical link is missing',
      check: (data) => (data.canonical === null ? {} : null),
    },
    {
      id: 'canonical/relative-url',
      severity: 'warning',
      message: 'Canonical URL is relative. Should be absolute',
      check: (data) =>
        data.canonical !== null && !isAbsoluteUrl(data.canonical)
          ? { path: 'canonical', actual: data.canonical }
          : null,
    },
    {
      id: 'canonical/mismatch-og-url',
      severity: 'warning',
      message: 'Canonical URL does not match og:url',
      check: (data, context) => {
        if (!context || data.canonical === null) {
          return null;
        }

        const ogEnvelope = context.find(
          (entry): entry is ExtractionEnvelope<OpenGraphData> => entry.type === 'opengraph',
        );
        const ogUrl = ogEnvelope?.data['og:url'];
        const ogValue = Array.isArray(ogUrl) ? ogUrl[0] : ogUrl;
        return ogValue && ogValue !== data.canonical ? { expected: data.canonical, actual: ogValue } : null;
      },
    },
    {
      id: 'canonical/hreflang-missing-x-default',
      severity: 'info',
      message: 'hreflang is defined but x-default is missing',
      check: (data) =>
        data.hreflang.length > 0 && !data.hreflang.some((entry) => entry.lang.toLowerCase() === 'x-default')
          ? {}
          : null,
    },
    {
      id: 'canonical/hreflang-missing-self',
      severity: 'warning',
      message: 'Current page URL is not included in hreflang entries',
      check: (data, _context, envelope) => {
        if (data.hreflang.length === 0 || envelope.source === '') {
          return null;
        }

        return data.hreflang.some((entry) => entry.href === envelope.source) ? null : { expected: envelope.source };
      },
    },
    {
      id: 'canonical/hreflang-relative-url',
      severity: 'warning',
      message: 'hreflang URL should be absolute',
      check: (data) => {
        const diagnostics = data.hreflang.flatMap((entry, index) =>
          !isAbsoluteUrl(entry.href) ? [{ path: `hreflang[${index}].href`, actual: entry.href }] : [],
        );
        return diagnostics.length > 0 ? diagnostics : null;
      },
    },
  ];

  async validate(
    envelope: ExtractionEnvelope<CanonicalData>,
    context?: ExtractionEnvelope[],
    options?: { isRuleEnabled?: (ruleId: string) => boolean },
  ): Promise<ReturnType<typeof runRules<CanonicalData>>> {
    return runRules(envelope, context, this.rules, options);
  }
}

export const canonicalRuleCatalog = createRuleCatalog('canonical', new CanonicalValidator().rules);
