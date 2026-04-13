import { describe, expect, test } from 'vitest';
import { formatValidationReport, hasFailed } from '../../src/index.js';
import { validationReportFixture } from '../fixtures/validation-report.js';

describe('json validation formatter', () => {
  test('keeps all diagnostics regardless of minSeverity and exposes passed state', () => {
    const output = formatValidationReport(validationReportFixture, {
      format: 'json',
      jsonPretty: true,
      minSeverity: 'error',
    });
    const parsed = JSON.parse(output) as {
      passed: boolean;
      summary: { total: number };
      validations: Array<{ diagnostics: unknown[] }>;
    };

    expect(parsed.summary.total).toBe(4);
    expect(parsed.validations.flatMap((validation) => validation.diagnostics)).toHaveLength(4);
    expect(parsed.passed).toBe(!hasFailed(validationReportFixture));
    expect(output).toContain('\n  "summary"');
  });

  test('supports compact output', () => {
    const output = formatValidationReport(validationReportFixture, { format: 'json', jsonPretty: false });

    expect(output).not.toContain('\n');
    expect(() => JSON.parse(output)).not.toThrow();
  });
});
