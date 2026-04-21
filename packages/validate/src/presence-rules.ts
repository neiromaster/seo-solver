import type { ExtractedTargetStatus, TargetKey } from '@seo-solver/types/extract';
import type { Diagnostic, Severity } from '@seo-solver/types/validate';

export type PresenceRuleDefinition = {
  target: TargetKey;
  validatorType: string;
  ruleId: string;
  severity: Severity;
  message: string;
};

const PRESENCE_RULES: readonly PresenceRuleDefinition[] = [
  {
    target: 'canonical',
    validatorType: 'canonical',
    ruleId: 'canonical/section-missing',
    severity: 'warning',
    message: 'Canonical section is missing',
  },
  {
    target: 'headings',
    validatorType: 'headings',
    ruleId: 'headings/section-missing',
    severity: 'warning',
    message: 'Headings section is missing',
  },
  {
    target: 'jsonld',
    validatorType: 'jsonld',
    ruleId: 'jsonld/section-missing',
    severity: 'warning',
    message: 'JSON-LD section is missing',
  },
  {
    target: 'meta',
    validatorType: 'meta',
    ruleId: 'meta/section-missing',
    severity: 'warning',
    message: 'Meta section is missing',
  },
  {
    target: 'opengraph',
    validatorType: 'opengraph',
    ruleId: 'opengraph/section-missing',
    severity: 'warning',
    message: 'Open Graph section is missing',
  },
  {
    target: 'robotsTxt',
    validatorType: 'robots-txt',
    ruleId: 'robots/section-missing',
    severity: 'info',
    message: 'robots.txt section is missing',
  },
];

const PRESENCE_RULES_BY_TARGET = new Map(PRESENCE_RULES.map((rule) => [rule.target, rule]));

export function listPresenceRules(): readonly PresenceRuleDefinition[] {
  return PRESENCE_RULES;
}

export function getPresenceRule(target: TargetKey): PresenceRuleDefinition {
  const rule = PRESENCE_RULES_BY_TARGET.get(target);
  if (!rule) {
    throw new Error(`Unknown presence rule target: ${target}`);
  }

  return rule;
}

export function toPresenceDiagnostics(
  targetStatus: ExtractedTargetStatus,
  source: string,
  allowedValidatorTypes?: ReadonlySet<string>,
): Array<{ type: string; source: string; diagnostics: Diagnostic[] }> {
  const results: Array<{ type: string; source: string; diagnostics: Diagnostic[] }> = [];

  for (const [target, status] of Object.entries(targetStatus) as [TargetKey, ExtractedTargetStatus[TargetKey]][]) {
    if (status !== 'missing') {
      continue;
    }

    const rule = getPresenceRule(target);
    if (allowedValidatorTypes && !allowedValidatorTypes.has(rule.validatorType)) {
      continue;
    }

    results.push({
      type: rule.validatorType,
      source,
      diagnostics: [
        {
          severity: rule.severity,
          rule: rule.ruleId,
          message: rule.message,
        },
      ],
    });
  }

  return results;
}
