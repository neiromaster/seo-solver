import type { Reporter, ReporterConfig } from '@seo-solver/types/report';
import { formatJsonComparison } from './comparison.js';
import { formatJsonValidation } from './validation.js';

export function createJsonReporter(config: ReporterConfig): Reporter {
  return {
    formatComparison(report) {
      return formatJsonComparison(report, config);
    },
    formatValidation(report) {
      return formatJsonValidation(report, config);
    },
  };
}
