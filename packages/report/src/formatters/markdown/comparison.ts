import type { ComparisonReport, ComparisonResult } from '@seo-solver/types/compare';
import type { ReporterConfig } from '@seo-solver/types/report';
import { summarizeComparison } from '../../core/summary.js';
import {
  formatComparisonSummaryLine,
  formatDiffIcon,
  formatDiffLabel,
  formatDiffPath,
  formatStatus,
  formatTypeLabel,
} from '../../utils/text.js';
import { formatFullValue } from '../../utils/truncate.js';
import { formatHeadingEntry, isHeadingEntry, isHeadingsComparison } from '../comparison/headings.js';

function formatComparisonValue(comparison: ComparisonResult, value: unknown): string {
  if (isHeadingsComparison(comparison) && isHeadingEntry(value)) {
    return formatHeadingEntry(value);
  }

  return formatFullValue(value);
}

function pushHeadingDiffBlock(lines: string[], entries: string[]): void {
  lines.push('');
  lines.push('  ```diff');

  for (const entry of entries) {
    lines.push(`  ${entry}`);
  }

  lines.push('  ```');
}

export function formatMarkdownComparison(report: ComparisonReport, _config: ReporterConfig): string {
  const summary = summarizeComparison(report);
  const lines = [
    '# SEO Comparison',
    '',
    '| | URL | Status | Time |',
    '|---|-----|--------|------|',
    `| A | ${report.urlA} | ${formatStatus(report.fetchA.statusCode)} | ${report.fetchA.timing}ms |`,
    `| B | ${report.urlB} | ${formatStatus(report.fetchB.statusCode)} | ${report.fetchB.timing}ms |`,
    '',
    '## Summary',
    '',
    formatComparisonSummaryLine(summary),
  ];

  for (const comparison of report.comparisons) {
    lines.push('', `## ${formatTypeLabel(comparison.type)}`, '');

    if (comparison.diffs.length === 0) {
      lines.push('✅ Identical');
      continue;
    }

    for (const diff of comparison.diffs) {
      const icon = formatDiffIcon(diff.kind);
      const label = formatDiffLabel(diff.kind);
      const path = diff.path === '' ? '*(entire type)*' : `\`${formatDiffPath(diff)}\``;

      lines.push(`- **${icon} ${label}** ${path}`);

      if (isHeadingsComparison(comparison) && diff.path !== '') {
        if (diff.kind === 'changed') {
          pushHeadingDiffBlock(lines, [
            `- ${formatComparisonValue(comparison, diff.before)}`,
            `+ ${formatComparisonValue(comparison, diff.after)}`,
          ]);
        } else if (diff.kind === 'added') {
          pushHeadingDiffBlock(lines, [`+ ${formatComparisonValue(comparison, diff.after)}`]);
        } else {
          pushHeadingDiffBlock(lines, [`- ${formatComparisonValue(comparison, diff.before)}`]);
        }

        continue;
      }

      if (diff.kind === 'changed') {
        lines.push(`  - **–** \`${formatComparisonValue(comparison, diff.before)}\``);
        lines.push(`  - **+** \`${formatComparisonValue(comparison, diff.after)}\``);
      } else if (diff.kind === 'added') {
        if (diff.path === '') {
          lines.push('  Present');
        } else {
          lines.push(`  - **+** \`${formatComparisonValue(comparison, diff.after)}\``);
        }
      } else {
        // removed
        if (diff.path === '') {
          lines.push('  Present');
        } else {
          lines.push(`  - **–** \`${formatComparisonValue(comparison, diff.before)}\``);
        }
      }
    }
  }

  return lines.join('\n');
}
