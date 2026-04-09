import type { ReporterConfig, ValidationReport } from '@seo-solver/types';
import { filterDiagnosticsBySeverity } from '../../filter.js';
import { hasFailed, summarizeValidation } from '../../summary.js';

export function formatJsonValidation(report: ValidationReport, config: ReporterConfig): string {
  const filteredReport: ValidationReport = {
    ...report,
    validations: report.validations
      .map((validation) => ({
        ...validation,
        diagnostics: filterDiagnosticsBySeverity(validation.diagnostics, config.minSeverity),
      }))
      .filter((validation) => validation.diagnostics.length > 0),
  };

  const payload = {
    ...filteredReport,
    passed: !hasFailed(report),
    summary: summarizeValidation(report),
  };

  return JSON.stringify(payload, null, config.jsonPretty === false ? undefined : 2);
}
