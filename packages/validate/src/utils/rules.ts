import type { ExtractionEnvelope } from '@seo-solver/types/extract';
import type { Diagnostic, Severity } from '@seo-solver/types/validate';

export type RuleResult = {
  path?: string;
  expected?: unknown;
  actual?: unknown;
  message?: string;
};

export type RuleDefinition<T> = {
  id: string;
  severity: Severity;
  message: string;
  check: (
    data: T,
    context: ExtractionEnvelope[] | undefined,
    envelope: ExtractionEnvelope<T>,
  ) => RuleResult | RuleResult[] | null;
};

export type RuleAwareValidator<T = unknown> = {
  readonly type: string;
  readonly rules?: readonly Pick<RuleDefinition<T>, 'id' | 'severity'>[];
  validate(
    envelope: ExtractionEnvelope,
    context?: ExtractionEnvelope[],
    options?: { disableAdobeValidation?: boolean; isRuleEnabled?: (ruleId: string) => boolean },
  ): Promise<Diagnostic[]>;
};

export function runRules<T>(
  envelope: ExtractionEnvelope<T>,
  context: ExtractionEnvelope[] | undefined,
  rules: readonly RuleDefinition<T>[],
  options?: { isRuleEnabled?: (ruleId: string) => boolean },
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const rule of rules) {
    if (options?.isRuleEnabled && !options.isRuleEnabled(rule.id)) {
      continue;
    }

    const result = rule.check(envelope.data, context, envelope);
    if (result === null) {
      continue;
    }

    const results = Array.isArray(result) ? result : [result];
    for (const item of results) {
      diagnostics.push({
        severity: rule.severity,
        rule: rule.id,
        message: item.message ?? rule.message,
        path: item.path,
        expected: item.expected,
        actual: item.actual,
      });
    }
  }

  return diagnostics;
}

export function createRuleCatalog<T>(
  validator: string,
  rules: readonly RuleDefinition<T>[],
): Array<{
  rule: string;
  severity: Severity;
  validator: string;
}> {
  return rules.map((rule) => ({ rule: rule.id, severity: rule.severity, validator }));
}
