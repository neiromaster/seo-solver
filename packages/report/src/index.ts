import type { ComparisonReport } from '@seo-solver/types/compare';
import type { ReporterConfig } from '@seo-solver/types/report';
import type { ValidationReport } from '@seo-solver/types/validate';
import { createReporter } from './create-reporter';

export function formatValidationReport(report: ValidationReport, options?: ReporterConfig): string {
  return createReporter(options).formatValidationReport(report);
}

export function formatComparisonReport(report: ComparisonReport, options?: ReporterConfig): string {
  return createReporter(options).formatComparisonReport(report);
}

export type { ComparisonReport } from '@seo-solver/types/compare';
export type {
  ComparisonSummary,
  Reporter,
  ReporterConfig,
  ReportFormat,
  ValidationSummary,
  Verbosity,
} from '@seo-solver/types/report';
export type { ValidationReport } from '@seo-solver/types/validate';
export { createReporter } from './create-reporter';
export { filterDiagnosticsBySeverity } from './filter';
export type { DiagnosticGroup } from './summary';
export { groupDiagnostics, hasDiffs, hasFailed, summarizeComparison, summarizeValidation } from './summary';
