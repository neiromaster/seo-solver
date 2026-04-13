import type { ReporterConfig } from '@seo-solver/types/report';
import type { ValidationReport } from '@seo-solver/types/validate';
import { hasFailed, summarizeValidation } from '../../summary';

export function formatJsonValidation(report: ValidationReport, config: ReporterConfig): string {
  const payload = {
    ...report,
    passed: !hasFailed(report),
    summary: summarizeValidation(report),
  };

  const indent = config.jsonPretty === false ? undefined : 2;
  const output = JSON.stringify(payload, null, indent);
  return indent === undefined ? output : `${output}\n`;
}
