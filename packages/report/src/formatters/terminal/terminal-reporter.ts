import type { Reporter, ReporterConfig } from '@seo-solver/types/report';
import { shouldUseColor } from '../../utils/color-detect.js';
import { formatTerminalComparison } from './comparison.js';
import { formatTerminalValidation } from './validation.js';

export function createTerminalReporter(config: ReporterConfig): Reporter {
  const resolved = {
    color: shouldUseColor(config.color),
    minSeverity: config.minSeverity ?? 'info',
    verbosity: config.verbosity ?? 'normal',
  } as const;

  return {
    formatComparisonReport(report) {
      return formatTerminalComparison(report, resolved);
    },
    formatValidationReport(report) {
      return formatTerminalValidation(report, resolved);
    },
  };
}
