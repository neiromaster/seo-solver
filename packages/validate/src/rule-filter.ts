import type { Diagnostic, Severity } from '@seo-solver/types';

export type RuleFilterConfig = {
  disableRules: string[];
  severityOverrides: Record<string, Severity>;
};

export function createRuleFilter(config: RuleFilterConfig) {
  return {
    isDisabled(ruleId: string): boolean {
      return config.disableRules.some((pattern) => matchesDisablePattern(ruleId, pattern));
    },
    hasWildcardDisabled(prefix: string): boolean {
      return config.disableRules.includes(`${prefix}/*`);
    },
    getSeverity(ruleId: string, defaultSeverity: Severity): Severity {
      return config.severityOverrides[ruleId] ?? defaultSeverity;
    },
    apply(diagnostics: Diagnostic[]): Diagnostic[] {
      return diagnostics
        .filter((diagnostic) => !this.isDisabled(diagnostic.rule))
        .map((diagnostic) => ({
          ...diagnostic,
          severity: this.getSeverity(diagnostic.rule, diagnostic.severity),
        }));
    },
  };
}

export function matchesDisablePattern(ruleId: string, pattern: string): boolean {
  if (pattern.endsWith('/*')) {
    return ruleId.startsWith(pattern.slice(0, -1));
  }

  return ruleId === pattern;
}
