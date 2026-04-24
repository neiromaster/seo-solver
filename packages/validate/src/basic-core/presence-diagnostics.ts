import type { ExtractedTargetStatus, TargetKey } from '@seo-solver/types/extract';
import type { Diagnostic } from '@seo-solver/types/validate';
import { getPresenceRule } from './presence-rule-data.js';

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
