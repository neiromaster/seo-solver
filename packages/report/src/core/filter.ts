import type { Diagnostic, Severity } from '@seo-solver/types/validate';

export const SEVERITY_ORDER: Record<Severity, number> = {
  error: 3,
  warning: 2,
  info: 1,
};

export function filterDiagnosticsBySeverity(diagnostics: Diagnostic[], minSeverity: Severity = 'info'): Diagnostic[] {
  const min = SEVERITY_ORDER[minSeverity];

  return diagnostics.filter((diagnostic) => SEVERITY_ORDER[diagnostic.severity] >= min);
}
