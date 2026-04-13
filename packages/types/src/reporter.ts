import type { ComparisonReport } from './comparison-report';
import type { Severity } from './diagnostic';
import type { ValidationReport } from './validation-report';

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
