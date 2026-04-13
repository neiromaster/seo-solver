import type { Reporter, ReporterConfig } from '@seo-solver/types/report';
import { formatMarkdownComparison } from './comparison';
import { formatMarkdownValidation } from './validation';

export function createMarkdownReporter(config: ReporterConfig): Reporter {
  return {
    formatComparisonReport(report) {
      return formatMarkdownComparison(report, config);
    },
    formatValidationReport(report) {
      return formatMarkdownValidation(report, config);
    },
  };
}
