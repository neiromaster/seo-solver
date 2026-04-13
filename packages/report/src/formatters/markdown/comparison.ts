import type { ComparisonReport } from '@seo-solver/types/compare';
import type { ReporterConfig } from '@seo-solver/types/report';
import { summarizeComparison } from '../../summary.js';
import {
  formatComparisonSummaryLine,
  formatDiffIcon,
  formatDiffLabel,
  formatDiffPath,
  formatStatus,
  formatTypeLabel,
} from '../../utils/text.js';
import { formatFullValue } from '../../utils/truncate.js';

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

      if (diff.kind === 'changed') {
        lines.push(`  - **–** \`${formatFullValue(diff.before)}\``);
        lines.push(`  - **+** \`${formatFullValue(diff.after)}\``);
      } else if (diff.kind === 'added') {
        if (diff.path === '') {
          lines.push('  Present');
        } else {
          lines.push(`  - **+** \`${formatFullValue(diff.after)}\``);
        }
      } else {
        // removed
        if (diff.path === '') {
          lines.push('  Present');
        } else {
          lines.push(`  - **–** \`${formatFullValue(diff.before)}\``);
        }
      }
    }
  }

  return lines.join('\n');
}
