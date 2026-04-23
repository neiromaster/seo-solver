export type { Reporter, ReporterConfig, ReportFormat, Verbosity } from '@seo-solver/types/report';
export { createReporter } from './core/create-reporter.js';
export { filterDiagnosticsBySeverity } from './core/filter.js';
export type { DiagnosticGroup } from './core/summary.js';
export { groupDiagnostics, summarizeComparison, summarizeValidation } from './core/summary.js';
