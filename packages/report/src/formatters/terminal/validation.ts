import type { ReporterConfig } from '@seo-solver/types/report';
import type { ValidationReport } from '@seo-solver/types/validate';
import { filterDiagnosticsBySeverity } from '../../filter.js';
import { type DiagnosticGroup, groupDiagnostics, hasFailed, summarizeValidation } from '../../summary.js';
import {
  formatSeverityIcon,
  formatStatus,
  formatTypeLabel,
  formatValidationSummaryLine,
  renderSectionHeading,
} from '../../utils/text.js';
import { formatFullValue } from '../../utils/truncate.js';
import { createTerminalColors, type TerminalColors } from './colors.js';

type ResolvedTerminalConfig = Required<Pick<ReporterConfig, 'color' | 'minSeverity' | 'verbosity'>>;

function colorSeverity(colors: TerminalColors, severity: 'error' | 'warning' | 'info', value: string): string {
  if (severity === 'error') {
    return colors.error(value);
  }

  if (severity === 'warning') {
    return colors.warning(value);
  }

  return colors.info(value);
}

const DETAIL_INDENT = '             ';

function wrapText(text: string, maxWidth = 72): string[] {
  const normalized = text.trim();

  if (normalized === '') {
    return [''];
  }

  const words = normalized.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (current === '') {
      current = word;
      continue;
    }

    if (`${current} ${word}`.length <= maxWidth) {
      current = `${current} ${word}`;
      continue;
    }

    lines.push(current);
    current = word;
  }

  if (current !== '') {
    lines.push(current);
  }

  return lines;
}

function renderDetailValue(value: unknown): string {
  if (typeof value === 'string') {
    return value.replace(/\r?\n/g, '\\n');
  }

  return formatFullValue(value);
}

function renderGroupedDiagnostic(
  lines: string[],
  group: DiagnosticGroup,
  colors: TerminalColors,
  verbose: boolean,
): void {
  const icon = colorSeverity(colors, group.severity, formatSeverityIcon(group.severity));
  const severityText = colorSeverity(colors, group.severity, group.severity.padEnd(7));
  const countSuffix = group.count > 1 ? `  ${colors.dim(`×${group.count}`)}` : '';

  lines.push(`  ${icon} ${severityText}  ${group.rule}${countSuffix}`);

  for (const messageLine of wrapText(group.message)) {
    lines.push(`${DETAIL_INDENT}${messageLine}`);
  }

  if (group.paths.length === 1) {
    if (verbose) {
      lines.push(`${DETAIL_INDENT}path:     ${group.paths[0]}`);
    } else {
      lines.push(`${DETAIL_INDENT}${colors.dim(group.paths[0] ?? '')}`);
    }
  } else if (group.paths.length > 1) {
    for (const [index, path] of group.paths.entries()) {
      const prefix = index === group.paths.length - 1 ? '└── ' : '├── ';
      lines.push(`${DETAIL_INDENT}${colors.dim(`${prefix}${path}`)}`);
    }
  }

  if (verbose && group.expected !== undefined) {
    lines.push(`${DETAIL_INDENT}expected: ${renderDetailValue(group.expected)}`);
  }

  if (verbose && group.actual !== undefined) {
    lines.push(`${DETAIL_INDENT}actual:   ${renderDetailValue(group.actual)}`);

    if (typeof group.actual !== 'number' && typeof group.actual !== 'boolean' && group.actual !== null) {
      lines.push(`${DETAIL_INDENT}value:    ${formatFullValue(group.actual)}`);
    }
  }

  lines.push('');
}

export function formatTerminalValidation(report: ValidationReport, config: ResolvedTerminalConfig): string {
  const colors = createTerminalColors(config.color);
  const summary = summarizeValidation(report);
  const failed = hasFailed(report);
  const headerIcon = failed ? colors.error('✗') : colors.pass('✓');

  if (config.verbosity === 'quiet') {
    return `${headerIcon} ${report.url}  ${formatValidationSummaryLine(summary)}`;
  }

  const headerDetails = `${formatStatus(report.fetch.statusCode)}  (${report.fetch.timing}ms`;
  const redirectSuffix =
    config.verbosity === 'verbose' && report.fetch.redirects.length > 0
      ? `, ${report.fetch.redirects.length} redirect${report.fetch.redirects.length === 1 ? '' : 's'}: ${report.fetch.redirects
          .map(([status, url]) => `${status} → ${url}`)
          .join(', ')}`
      : '';
  const lines = [`${headerIcon} ${report.url}  ${headerDetails}${redirectSuffix})`, ''];

  for (const validation of report.validations) {
    const visibleDiagnostics = filterDiagnosticsBySeverity(validation.diagnostics, config.minSeverity);
    const hasHiddenDiagnostics = validation.diagnostics.length > 0 && visibleDiagnostics.length === 0;
    lines.push(renderSectionHeading(formatTypeLabel(validation.type)));

    if (visibleDiagnostics.length === 0) {
      if (hasHiddenDiagnostics) {
        lines.push(`  ${colors.dim('No visible diagnostics at current minSeverity')}`);
        lines.push('');
        continue;
      }

      lines.push(`  ${colors.pass('✓')} All checks passed`);
      lines.push('');
      continue;
    }

    const groups = groupDiagnostics(visibleDiagnostics);

    for (const group of groups) {
      renderGroupedDiagnostic(lines, group, colors, config.verbosity === 'verbose');
    }

    if (lines.at(-1) !== '') {
      lines.push('');
    }
  }

  lines.push(renderSectionHeading('Summary'));
  lines.push(`  ${colors.bold(formatValidationSummaryLine(summary))}`);

  return lines.join('\n');
}
