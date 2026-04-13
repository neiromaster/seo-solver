import type { Reporter, ReporterConfig } from '@seo-solver/types/report';
import { formatHtmlComparison } from './comparison';
import { formatHtmlValidation } from './validation';

export function createHtmlReporter(config: ReporterConfig): Reporter {
  return {
    formatComparisonReport(report) {
      return formatHtmlComparison(report, config);
    },
    formatValidationReport(report) {
      return formatHtmlValidation(report, config);
    },
  };
}
