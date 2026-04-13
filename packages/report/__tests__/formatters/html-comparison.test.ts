import { describe, expect, test } from 'vitest';
import { formatComparisonReport } from '../../src/index.js';
import { comparisonReportFixture } from '../fixtures/comparison-report.js';

describe('html comparison formatter', () => {
  test('renders 3-column table with rowspan for changed diffs', () => {
    const output = formatComparisonReport(comparisonReportFixture, { format: 'html' });

    expect(output).toContain('<th>Change</th><th>Path</th><th>Value</th>');

    // Changed diffs use rowspan="2"
    expect(output).toContain('rowspan="2"');
    expect(output).toContain('class="diff-start"');
    expect(output).toContain('class="diff-after"');
  });

  test('shows full values without truncation', () => {
    const output = formatComparisonReport(comparisonReportFixture, { format: 'html' });

    // Full title, not truncated
    expect(output).toContain('Draft Title That Was Used During Development Phase');
    expect(output).toContain(
      'Updated line with &lt;final&gt; and a much longer description to exercise truncation in normal mode',
    );

    // Added value
    expect(output).toContain('article');

    // No truncation markers
    expect(output).not.toContain('...');
  });

  test('applies color classes to before/after values', () => {
    const output = formatComparisonReport(comparisonReportFixture, { format: 'html' });

    expect(output).toContain('class="cell-before"');
    expect(output).toContain('class="cell-after"');
  });

  test('renders badges for diff kinds', () => {
    const output = formatComparisonReport(comparisonReportFixture, { format: 'html' });

    expect(output).toContain('class="kind-badge changed"');
    expect(output).toContain('class="kind-badge added"');
    expect(output).toContain('class="kind-badge removed"');
  });

  test('no external assets', () => {
    const output = formatComparisonReport(comparisonReportFixture, { format: 'html' });

    expect(output).not.toContain('<link rel=');
    expect(output).not.toContain('<script src=');
  });
});
