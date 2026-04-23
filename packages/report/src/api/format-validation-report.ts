import type { ReporterConfig } from '@seo-solver/types/report';
import type { ValidationReport } from '@seo-solver/types/validate';
import { createReporter } from '../core/create-reporter.js';

export function formatValidationReport(report: ValidationReport, options?: ReporterConfig): string {
  return createReporter(options).formatValidationReport(report);
}
