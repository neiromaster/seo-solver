import type { ComparisonReport } from '@seo-solver/types/compare';
import type { ReporterConfig } from '@seo-solver/types/report';
import { summarizeComparison } from '../../core/summary.js';
import {
  formatDiffIcon,
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

function formatRawValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (value === undefined) {
    return 'undefined';
  }

  if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
    return String(value);
  }

  return formatFullValue(value);
}

function formatEntryPath(kind: 'added' | 'removed' | 'changed', path: string): string {
  if (path !== '(entire type)') {
    return path;
  }

  if (kind === 'added') {
    return '(entire type not present in A)';
  }

  if (kind === 'removed') {
    return '(entire type not present in B)';
  }

  return path;
}

function pushValueLines(lines: string[], colors: TerminalColors, kind: 'added' | 'removed', value: unknown): void {
  const prefix = kind === 'removed' ? '−' : '+';
  const color = kind === 'removed' ? colors.removed : colors.added;

  for (const valueLine of formatRawValue(value).split(/\r?\n/)) {
    lines.push(`    ${color(`${prefix} ${valueLine}`)}`);
  }
}

function formatTerminalSummaryLine(summary: ReturnType<typeof summarizeComparison>): string {
  return `${summary.changed} changed · ${summary.added} added · ${summary.removed} removed`;
}

export function formatTerminalComparison(report: ComparisonReport, config: ResolvedTerminalConfig): string {
  const colors = createTerminalColors(config.color ?? false);
  const summary = summarizeComparison(report);
  const hasDiffs = summary.total > 0;
  const headerIcon = hasDiffs ? colors.changed('~') : colors.pass('✓');

  if (config.verbosity === 'quiet') {
    return `${headerIcon} ${report.urlA} ↔ ${report.urlB}  ${formatTerminalSummaryLine(summary)}`;
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
      const path = formatEntryPath(diff.kind, formatDiffPath(diff));

      lines.push(`  ${icon} ${path}`);

      if (diff.kind === 'changed') {
        pushValueLines(lines, colors, 'removed', diff.before);
        pushValueLines(lines, colors, 'added', diff.after);
      } else if (diff.kind === 'added') {
        if (diff.path !== '') {
          pushValueLines(lines, colors, 'added', diff.after);
        }
      } else if (diff.path !== '') {
        pushValueLines(lines, colors, 'removed', diff.before);
      }

      lines.push('');
    }
  }

  lines.push(renderSectionHeading('Summary'));
  lines.push(`  ${colors.bold(formatTerminalSummaryLine(summary))}`);
  lines.push(`  ${colors.dim('~ changed  + added  - removed')}`);

  return lines.join('\n');
}
