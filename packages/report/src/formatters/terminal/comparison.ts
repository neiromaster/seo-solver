import type { ComparisonReport, ReporterConfig } from '@seo-solver/types';
import { summarizeComparison } from '../../summary.js';
import {
  formatComparisonSummaryLine,
  formatDiffIcon,
  formatDiffInline,
  formatDiffPath,
  formatStatus,
  formatTypeLabel,
  renderSectionHeading,
} from '../../utils/text.js';
import { formatFullValue } from '../../utils/truncate.js';
import { createTerminalColors, type TerminalColors } from './colors.js';

type ResolvedTerminalConfig = Required<Pick<ReporterConfig, 'color' | 'verbosity'>>;

function colorDiff(colors: TerminalColors, kind: 'added' | 'removed' | 'changed', value: string): string {
  if (kind === 'added') {
    return colors.added(value);
  }

  if (kind === 'removed') {
    return colors.removed(value);
  }

  return colors.changed(value);
}

export function formatTerminalComparison(report: ComparisonReport, config: ResolvedTerminalConfig): string {
  const colors = createTerminalColors(config.color);
  const summary = summarizeComparison(report);
  const hasDiffs = summary.total > 0;
  const headerIcon = hasDiffs ? colors.changed('~') : colors.pass('✓');

  if (config.verbosity === 'quiet') {
    return `${headerIcon} ${report.urlA} ↔ ${report.urlB}  ${formatComparisonSummaryLine(summary)}`;
  }

  const lines = [
    'Comparing:',
    `  A: ${report.urlA}  ${formatStatus(report.fetchA.statusCode)}  (${report.fetchA.timing}ms)`,
    `  B: ${report.urlB}  ${formatStatus(report.fetchB.statusCode)}  (${report.fetchB.timing}ms)`,
    '',
  ];

  for (const comparison of report.comparisons) {
    lines.push(renderSectionHeading(formatTypeLabel(comparison.type)));

    if (comparison.diffs.length === 0) {
      lines.push(`  ${colors.pass('✓')} Identical`);
      lines.push('');
      continue;
    }

    for (const diff of comparison.diffs) {
      const icon = colorDiff(colors, diff.kind, formatDiffIcon(diff.kind));
      const label = colorDiff(colors, diff.kind, diff.kind);
      const path = formatDiffPath(diff);

      if (config.verbosity === 'verbose') {
        lines.push(`  ${icon} ${label.padEnd(8)} ${path}`);

        if (diff.kind === 'changed') {
          lines.push(`             before: ${formatFullValue(diff.before)}`);
          lines.push(`             after:  ${formatFullValue(diff.after)}`);
        } else if (diff.kind === 'added') {
          lines.push(`             after:  ${formatFullValue(diff.after)}`);
        } else {
          lines.push(`             before: ${formatFullValue(diff.before)}`);
        }

        lines.push('');
        continue;
      }

      lines.push(`  ${icon} ${label.padEnd(8)} ${path.padEnd(16)} ${formatDiffInline(diff, false)}`);
    }

    lines.push('');
  }

  lines.push(renderSectionHeading('Summary'));
  lines.push(`  ${colors.bold(formatComparisonSummaryLine(summary))}`);

  return lines.join('\n');
}
