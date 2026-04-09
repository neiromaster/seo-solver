import { describe, expect, test } from 'vitest';
import { formatComparison, formatValidation, hasFailed } from '../src/index.js';
import { comparisonReportFixture } from './fixtures/comparison-report.js';
import { validationReportFixture } from './fixtures/validation-report.js';

describe('cross-format consistency', () => {
  test('validation formats agree on summary counts and pass/fail', () => {
    const json = JSON.parse(formatValidation(validationReportFixture, { format: 'json' })) as {
      passed: boolean;
      summary: { errors: number; warnings: number; info: number; total: number };
    };
    const terminal = formatValidation(validationReportFixture, { color: false, verbosity: 'normal' });
    const markdown = formatValidation(validationReportFixture, { format: 'markdown' });
    const html = formatValidation(validationReportFixture, { format: 'html' });

    expect(json.summary).toEqual({ errors: 1, warnings: 2, info: 1, total: 4 });
    expect(json.passed).toBe(!hasFailed(validationReportFixture));
    expect(terminal).toContain('1 errors · 2 warnings · 1 info');
    expect(markdown).toContain('| Errors | 1 |');
    expect(markdown).toContain('| Warnings | 2 |');
    expect(markdown).toContain('| Info | 1 |');
    expect(html).toContain('1 errors');
    expect(html).toContain('2 warnings');
    expect(html).toContain('1 info');
  });

  test('comparison formats agree on diff counts', () => {
    const json = JSON.parse(formatComparison(comparisonReportFixture, { format: 'json' })) as {
      hasDiffs: boolean;
      summary: { changed: number; added: number; removed: number; identical: number; total: number };
    };
    const terminal = formatComparison(comparisonReportFixture, { color: false, verbosity: 'normal' });
    const markdown = formatComparison(comparisonReportFixture, { format: 'markdown' });
    const html = formatComparison(comparisonReportFixture, { format: 'html' });

    expect(json.hasDiffs).toBe(true);
    expect(json.summary).toEqual({ changed: 2, added: 2, removed: 1, identical: 1, total: 5 });
    expect(terminal).toContain('2 changed · 2 added · 1 removed · 1 identical');
    expect(markdown).toContain('2 changed · 2 added · 1 removed · 1 identical');
    expect(html).toContain('2 changed');
    expect(html).toContain('2 added');
    expect(html).toContain('1 removed');
    expect(html).toContain('1 identical');
  });
});
