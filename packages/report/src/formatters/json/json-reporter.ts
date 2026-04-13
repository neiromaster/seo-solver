import type { Reporter, ReporterConfig } from '@seo-solver/types/report';
import { formatJsonComparison } from './comparison';
import { formatJsonValidation } from './validation';

export function createJsonReporter(config: ReporterConfig): Reporter {
  return {
    formatComparisonReport(report) {
      return formatJsonComparison(report, config);
    },
    formatValidationReport(report) {
      return formatJsonValidation(report, config);
    },
  };
}
