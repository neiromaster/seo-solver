import { describe, expect, test } from 'vitest';
import { comparisonReportFixture } from '../../test/fixtures/comparison-report.js';
import { formatComparisonReport } from '../index.js';

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

  test('renders headings changes as whole heading lines', () => {
    const output = formatComparisonReport(comparisonReportFixture, { format: 'html' });

    expect(output).toContain('<td rowspan="2"><code>[1]</code></td>');
    expect(output).toContain('<td class="cell-before"><code>h2: &quot;Enterprise&quot;</code></td>');
    expect(output).toContain('<td class="cell-after"><code>h3: &quot;Enterprise | Pro&quot;</code></td>');
    expect(output).toContain('<td class="cell-after"><code>h3: &quot;FAQ&quot;</code></td>');
    expect(output).not.toContain('&quot;{&quot;level&quot;:3,&quot;text&quot;:&quot;FAQ&quot;}&quot;');
  });
});
