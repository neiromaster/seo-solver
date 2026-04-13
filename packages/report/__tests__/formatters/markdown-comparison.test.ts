import { describe, expect, test } from 'vitest';
import { formatComparisonReport } from '../../src/index.js';
import { comparisonReportFixture } from '../fixtures/comparison-report.js';

describe('markdown comparison formatter', () => {
  test('renders diff tables, identical sections, and whole-type markers', () => {
    const output = formatComparisonReport(comparisonReportFixture, { format: 'markdown' });

    expect(output).toContain('| Change | Path | Before | After |');
    expect(output).toContain('✅ Identical');
    expect(output).toContain('*(entire type)*');
  });

  test('escapes markdown table cells and supports verbose values', () => {
    const output = formatComparisonReport(comparisonReportFixture, { format: 'markdown', verbosity: 'verbose' });

    expect(output).toContain('Enterprise \\| Pro');
    expect(output).toContain('Draft Title That Was Used During Development Phase');
  });
});
