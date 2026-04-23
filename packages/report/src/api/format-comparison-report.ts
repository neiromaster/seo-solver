import type { ComparisonReport } from '@seo-solver/types/compare';
import type { ReporterConfig } from '@seo-solver/types/report';
import { createReporter } from '../core/create-reporter.js';

export function formatComparisonReport(report: ComparisonReport, options?: ReporterConfig): string {
  return createReporter(options).formatComparisonReport(report);
}
