import { describe, expect, test } from 'vitest';
import { comparisonReportFixture } from '../../test/fixtures/comparison-report';
import { formatComparisonReport } from '../index';

describe('markdown comparison formatter', () => {
  test('renders list format with full values', () => {
    const output = formatComparisonReport(comparisonReportFixture, { format: 'markdown' });

    // List items, not table
    expect(output).toContain('- **~ Changed**');
    expect(output).toContain('- **+ Added**');
    expect(output).toContain('- **- Removed**');

    // Full values, not truncated
    expect(output).toContain('Draft Title That Was Used During Development Phase');
    expect(output).toContain(
      'Updated line with <final> and a much longer description to exercise truncation in normal mode',
    );
    expect(output).toContain('article');

    // No truncation markers
    expect(output).not.toContain('...');
  });

  test('uses bold minus/plus as nested list items', () => {
    const output = formatComparisonReport(comparisonReportFixture, { format: 'markdown' });

    // Changed diffs use bold –/+
    expect(output).toContain('- **–** `"Draft Title');
    expect(output).toContain('- **+** `"Final Title');

    // No "Before:" / "After:" labels
    expect(output).not.toContain('Before:');
    expect(output).not.toContain('After:');
  });

  test('renders identical sections and whole-type markers', () => {
    const output = formatComparisonReport(comparisonReportFixture, { format: 'markdown' });

    expect(output).toContain('✅ Identical');
    expect(output).toContain('*(entire type)*');
  });

  test('escapes pipe characters in paths', () => {
    const output = formatComparisonReport(comparisonReportFixture, { format: 'markdown' });

    expect(output).toContain('Enterprise | Pro');
  });
});
