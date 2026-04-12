import type { Severity } from '@seo-solver/types/validate';
import { array, multioption, string } from 'cmd-ts';
import { isSeverity } from '../types.js';

export const disableRulesFlag = multioption({
  long: 'disable-rule',
  type: array(string),
  description: 'Disable a validation rule (repeatable). Supports wildcards: og/*',
});

export const severityOverrideFlag = multioption({
  long: 'severity-override',
  type: array(string),
  description: 'Override rule severity: "og/description-missing=error" (repeatable)',
});

export function parseSeverityOverrides(raw: string[]): Record<string, Severity> {
  const result: Record<string, Severity> = {};

  for (const entry of raw) {
    const [rule, severity] = entry.split('=');

    if (!rule || !severity) {
      continue;
    }

    const normalizedRule = rule.trim();
    const normalizedSeverity = severity.trim();

    if (normalizedRule && isSeverity(normalizedSeverity)) {
      result[normalizedRule] = normalizedSeverity;
    }
  }

  return result;
}
