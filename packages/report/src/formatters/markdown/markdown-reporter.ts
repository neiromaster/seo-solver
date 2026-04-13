import type { Reporter, ReporterConfig } from '@seo-solver/types/report';
import { formatMarkdownComparison } from './comparison.js';
import { formatMarkdownValidation } from './validation.js';

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
