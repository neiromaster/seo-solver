import { formatValidationReport } from '@seo-solver/report';
import type { ValidationReport } from '@seo-solver/types/validate';

declare const report: ValidationReport;

console.log(formatValidationReport(report, { format: 'json' }));
