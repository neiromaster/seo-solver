import type { ComparisonReport, ReporterConfig, ValidationReport } from '@seo-solver/types';
import { createReporter } from './create-reporter.js';

export function formatValidation(report: ValidationReport, options?: ReporterConfig): string {
  return createReporter(options).formatValidation(report);
}

export function formatComparison(report: ComparisonReport, options?: ReporterConfig): string {
  return createReporter(options).formatComparison(report);
}

export type {
  ComparisonReport,
  ComparisonSummary,
  Reporter,
  ReporterConfig,
  ReportFormat,
  ValidationReport,
  ValidationSummary,
  Verbosity,
} from '@seo-solver/types';
export { createReporter } from './create-reporter.js';
export { filterDiagnosticsBySeverity } from './filter.js';
export type { DiagnosticGroup } from './summary.js';
export { groupDiagnostics, hasFailed, summarizeComparison, summarizeValidation } from './summary.js';
