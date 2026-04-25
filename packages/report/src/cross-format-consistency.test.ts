import { describe, expect, test } from 'vitest';
import { comparisonReportFixture } from '../test/fixtures/comparison-report.js';
import { validationReportFixture } from '../test/fixtures/validation-report.js';
import { formatComparisonReport, formatValidationReport, hasFailed } from './index.js';

describe('cross-format consistency', () => {
  test('validation formats agree on summary counts and pass/fail', () => {
    const json = JSON.parse(formatValidationReport(validationReportFixture, { format: 'json' })) as {
      passed: boolean;
      summary: { errors: number; warnings: number; info: number; total: number };
    };
    const terminal = formatValidationReport(validationReportFixture, { color: false, verbosity: 'normal' });
    const markdown = formatValidationReport(validationReportFixture, { format: 'markdown' });
    const html = formatValidationReport(validationReportFixture, { format: 'html' });

    expect(json.summary).toEqual({ errors: 1, warnings: 3, info: 0, total: 4 });
    expect(json.passed).toBe(!hasFailed(validationReportFixture));
    expect(terminal).toContain('1 errors · 3 warnings · 0 info');
    expect(markdown).toContain('| Errors | 1 |');
    expect(markdown).toContain('| Warnings | 3 |');
    expect(markdown).toContain('| Info | 0 |');
    expect(html).toContain('1 errors');
    expect(html).toContain('3 warnings');
    expect(html).toContain('0 info');
  });

  test('comparison formats agree on diff counts', () => {
    const json = JSON.parse(formatComparisonReport(comparisonReportFixture, { format: 'json' })) as {
      hasDiffs: boolean;
      summary: { changed: number; added: number; removed: number; identical: number; total: number };
    };
    const terminal = formatComparisonReport(comparisonReportFixture, { color: false, verbosity: 'normal' });
    const markdown = formatComparisonReport(comparisonReportFixture, { format: 'markdown' });
    const html = formatComparisonReport(comparisonReportFixture, { format: 'html' });

    expect(json.hasDiffs).toBe(true);
    expect(json.summary).toEqual({ changed: 3, added: 2, removed: 1, identical: 1, total: 6 });
    expect(terminal).toContain('3 changed · 2 added · 1 removed');
    expect(markdown).toContain('3 changed · 2 added · 1 removed · 1 identical');
    expect(html).toContain('3 changed');
    expect(html).toContain('2 added');
    expect(html).toContain('1 removed');
    expect(html).toContain('1 identical');
  });
});
