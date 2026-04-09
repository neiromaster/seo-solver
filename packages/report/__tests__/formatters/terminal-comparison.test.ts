import { describe, expect, test } from 'vitest';
import { formatComparison } from '../../src/index.js';
import { comparisonReportFixture } from '../fixtures/comparison-report.js';

describe('terminal comparison formatter', () => {
  test('renders normal output with identical and entire type markers', () => {
    const output = formatComparison(comparisonReportFixture, { color: false, format: 'terminal' });

    expect(output).toContain('✓ Identical');
    expect(output).toContain('(entire type)');
    expect(output).toContain('2 changed · 2 added · 1 removed · 1 identical');
  });

  test('truncates long values in normal mode but not in verbose mode', () => {
    const normalOutput = formatComparison(comparisonReportFixture, { color: false, verbosity: 'normal' });
    const verboseOutput = formatComparison(comparisonReportFixture, { color: false, verbosity: 'verbose' });

    expect(normalOutput).toContain('"Draft Title That Was Used During Development P...');
    expect(verboseOutput).toContain('Draft Title That Was Used During Development Phase');
    expect(verboseOutput).toContain(
      'after:  "Updated line with <final> and a much longer description to exercise truncation in normal mode"',
    );
  });
});
