import type { ComparisonReport } from './comparison-report.js';
import type { Severity } from './diagnostic.js';
import type { ValidationReport } from './validation-report.js';

export type ReportFormat = 'terminal' | 'json' | 'markdown' | 'html' | (string & {});

export type Verbosity = 'quiet' | 'normal' | 'verbose';

export type ReporterConfig = {
  format?: ReportFormat;
  verbosity?: Verbosity;
  minSeverity?: Severity;
  color?: boolean;
  jsonPretty?: boolean;
  markdownCollapsible?: boolean;
};

export type Reporter = {
  formatValidationReport(report: ValidationReport): string;
  formatComparisonReport(report: ComparisonReport): string;
};
