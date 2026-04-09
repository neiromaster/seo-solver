import type { ReporterConfig, ValidationReport } from '@seo-solver/types';
import { hasFailed, summarizeValidation } from '../../summary.js';

export function formatJsonValidation(report: ValidationReport, config: ReporterConfig): string {
  const payload = {
    ...report,
    passed: !hasFailed(report),
    summary: summarizeValidation(report),
  };

  return JSON.stringify(payload, null, config.jsonPretty === false ? undefined : 2);
}
