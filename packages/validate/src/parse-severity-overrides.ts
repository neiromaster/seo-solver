import type { Severity } from '@seo-solver/types/validate';
import { ValidationError } from './errors.js';
import { KNOWN_PREFIXES, KNOWN_RULE_IDS } from './rule-catalog.js';

const SEVERITIES: readonly Severity[] = ['error', 'warning', 'info'];

export function parseSeverityOverrides(raw: string[]): Record<string, Severity> {
  const result: Record<string, Severity> = {};

  for (const entry of raw) {
    const [rule, severity, ...rest] = entry.split('=');

    if (!rule || !severity || rest.length > 0) {
      throw new ValidationError(`Invalid severity override: ${entry}`, 'INVALID_SEVERITY_OVERRIDE', entry);
    }

    const normalizedRule = rule.trim();
    const normalizedSeverity = severity.trim();

    if (!normalizedRule || !isSeverity(normalizedSeverity) || !isKnownSelector(normalizedRule)) {
      throw new ValidationError(`Invalid severity override: ${entry}`, 'INVALID_SEVERITY_OVERRIDE', entry);
    }

    result[normalizedRule] = normalizedSeverity;
  }

  return result;
}

function isSeverity(value: string): value is Severity {
  return SEVERITIES.includes(value as Severity);
}

function isKnownSelector(value: string): boolean {
  if (KNOWN_RULE_IDS.has(value)) {
    return true;
  }

  if (value.endsWith('/*')) {
    return KNOWN_PREFIXES.has(value.slice(0, -2));
  }

  return false;
}
