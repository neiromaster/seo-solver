import type {
  ComparisonReport,
  ComparisonSummary,
  Diagnostic,
  Severity,
  ValidationReport,
  ValidationSummary,
} from '@seo-solver/types';

export type DiagnosticGroup = {
  severity: Severity;
  rule: string;
  message: string;
  paths: string[];
  expected?: unknown;
  actual?: unknown;
  count: number;
};

export function hasFailed(report: ValidationReport): boolean {
  return report.validations.some((validation) =>
    validation.diagnostics.some((diagnostic) => diagnostic.severity === 'error'),
  );
}

export function summarizeValidation(report: ValidationReport): ValidationSummary {
  const summary: ValidationSummary = {
    errors: 0,
    warnings: 0,
    info: 0,
    total: 0,
  };

  for (const validation of report.validations) {
    for (const diagnostic of validation.diagnostics) {
      summary.total += 1;

      if (diagnostic.severity === 'error') {
        summary.errors += 1;
      } else if (diagnostic.severity === 'warning') {
        summary.warnings += 1;
      } else {
        summary.info += 1;
      }
    }
  }

  return summary;
}

export function summarizeComparison(report: ComparisonReport): ComparisonSummary {
  const summary: ComparisonSummary = {
    added: 0,
    removed: 0,
    changed: 0,
    identical: 0,
    total: 0,
  };

  for (const comparison of report.comparisons) {
    if (comparison.diffs.length === 0) {
      summary.identical += 1;
      continue;
    }

    for (const diff of comparison.diffs) {
      summary.total += 1;

      if (diff.kind === 'added') {
        summary.added += 1;
      } else if (diff.kind === 'removed') {
        summary.removed += 1;
      } else {
        summary.changed += 1;
      }
    }
  }

  return summary;
}

export function groupDiagnostics(diagnostics: Diagnostic[]): DiagnosticGroup[] {
  const groups = new Map<string, DiagnosticGroup>();

  for (const diagnostic of diagnostics) {
    const key = `${diagnostic.rule}::${diagnostic.severity}::${diagnostic.message}`;
    const existing = groups.get(key);

    if (existing) {
      existing.count += 1;

      if (diagnostic.path) {
        existing.paths.push(diagnostic.path);
      }

      continue;
    }

    groups.set(key, {
      severity: diagnostic.severity,
      rule: diagnostic.rule,
      message: diagnostic.message,
      paths: diagnostic.path ? [diagnostic.path] : [],
      expected: diagnostic.expected,
      actual: diagnostic.actual,
      count: 1,
    });
  }

  return [...groups.values()];
}
