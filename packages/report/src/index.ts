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
export { formatComparisonReport } from './api/format-comparison-report.js';
export { formatValidationReport } from './api/format-validation-report.js';
export { hasDiffs, hasFailed } from './core/summary.js';
