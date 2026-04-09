import type { Reporter, ReporterConfig } from '@seo-solver/types';
import { formatHtmlComparison } from './comparison.js';
import { formatHtmlValidation } from './validation.js';

export function createHtmlReporter(config: ReporterConfig): Reporter {
  return {
    formatComparison(report) {
      return formatHtmlComparison(report, config);
    },
    formatValidation(report) {
      return formatHtmlValidation(report, config);
    },
  };
}
