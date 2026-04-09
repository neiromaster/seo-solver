import type { ComparisonReport, ReporterConfig } from '@seo-solver/types';
import { summarizeComparison } from '../../summary.js';

export function formatJsonComparison(report: ComparisonReport, config: ReporterConfig): string {
  const summary = summarizeComparison(report);
  const payload = {
    ...report,
    hasDiffs: summary.total > 0,
    summary,
  };

  return JSON.stringify(payload, null, config.jsonPretty === false ? undefined : 2);
}
