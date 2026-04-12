import type { ComparisonReport } from '@seo-solver/types/compare';
import type { ReporterConfig } from '@seo-solver/types/report';
import { summarizeComparison } from '../../summary.js';
import {
  escapeMarkdownTableCell,
  formatComparisonSummaryLine,
  formatDiffIcon,
  formatDiffLabel,
  formatDiffMarkdownAfter,
  formatDiffMarkdownBefore,
  formatDiffPath,
  formatStatus,
  formatTypeLabel,
} from '../../utils/text.js';

export function formatMarkdownComparison(report: ComparisonReport, config: ReporterConfig): string {
  const verbose = config.verbosity === 'verbose';
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

    lines.push('| Change | Path | Before | After |');
    lines.push('|--------|------|--------|-------|');

    for (const diff of comparison.diffs) {
      lines.push(
        `| ${formatDiffIcon(diff.kind)} ${formatDiffLabel(diff.kind)} | ${escapeMarkdownTableCell(
          diff.path === '' ? '*(entire type)*' : `\`${formatDiffPath(diff)}\``,
        )} | ${escapeMarkdownTableCell(formatDiffMarkdownBefore(diff, verbose))} | ${escapeMarkdownTableCell(
          formatDiffMarkdownAfter(diff, verbose),
        )} |`,
      );
    }
  }

  return lines.join('\n');
}
