import { describe, expect, test } from 'vitest';
import { filterDiagnosticsBySeverity } from '../src/index.js';
import { validationReportFixture } from './fixtures/validation-report.js';

describe('filterDiagnosticsBySeverity', () => {
  const diagnostics = validationReportFixture.validations.flatMap((validation) => validation.diagnostics);

  test('keeps all diagnostics for info', () => {
    expect(filterDiagnosticsBySeverity(diagnostics, 'info')).toHaveLength(4);
  });

  test('filters info for warning threshold', () => {
    expect(filterDiagnosticsBySeverity(diagnostics, 'warning').map((entry) => entry.severity)).toEqual([
      'error',
      'warning',
      'warning',
      'warning',
    ]);
  });

  test('keeps only errors for error threshold', () => {
    expect(filterDiagnosticsBySeverity(diagnostics, 'error').map((entry) => entry.rule)).toEqual([
      'opengraph/title-missing',
    ]);
  });
});
