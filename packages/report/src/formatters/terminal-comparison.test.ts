import { describe, expect, test } from 'vitest';
import { comparisonReportFixture } from '../../test/fixtures/comparison-report.js';
import { formatComparisonReport } from '../index.js';

describe('terminal comparison formatter', () => {
  test('renders normal output with identical and entire type markers', () => {
    const output = formatComparisonReport(comparisonReportFixture, { color: false, format: 'terminal' });

    expect(output).toContain('✓ Identical');
    expect(output).toContain('(entire type not present in B)');
    expect(output).toContain('2 changed · 2 added · 1 removed');
    expect(output).toContain('~ changed  + added  - removed');
  });

  test('renders full multiline values in both normal and verbose mode', () => {
    const normalOutput = formatComparisonReport(comparisonReportFixture, { color: false, verbosity: 'normal' });
    const verboseOutput = formatComparisonReport(comparisonReportFixture, { color: false, verbosity: 'verbose' });

    expect(normalOutput).toContain('− Draft Title That Was Used During Development Phase');
    expect(normalOutput).toContain('+ Final Title For Production Release');
    expect(normalOutput).toContain('− Line 1');
    expect(normalOutput).toContain('− Line 2 with <draft>');
    expect(verboseOutput).toContain('Draft Title That Was Used During Development Phase');
    expect(verboseOutput).toContain(
      '+ Updated line with <final> and a much longer description to exercise truncation in normal mode',
    );
  });
});
