import type { ComparisonReport } from '@seo-solver/types/compare';
import type { ReporterConfig } from '@seo-solver/types/report';
import { summarizeComparison } from '../../summary';

export function formatJsonComparison(report: ComparisonReport, config: ReporterConfig): string {
  const summary = summarizeComparison(report);
  const payload = {
    ...report,
    hasDiffs: summary.total > 0,
    summary,
  };

  const indent = config.jsonPretty === false ? undefined : 2;
  const output = JSON.stringify(payload, null, indent);
  return indent === undefined ? output : `${output}\n`;
}
