import type { ReporterConfig, ValidationReport } from '@seo-solver/types';
import { filterDiagnosticsBySeverity } from '../../filter.js';
import { hasFailed, summarizeValidation } from '../../summary.js';
import {
  formatDiagnosticDetails,
  formatSeverityIcon,
  formatStatus,
  formatTypeLabel,
  formatValidationSummaryLine,
  renderSectionHeading,
} from '../../utils/text.js';
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

    for (const diagnostic of visibleDiagnostics) {
      const icon = colorSeverity(colors, diagnostic.severity, formatSeverityIcon(diagnostic.severity));
      const severityText = colorSeverity(colors, diagnostic.severity, diagnostic.severity);

      if (config.verbosity === 'verbose') {
        lines.push(`  ${icon} ${severityText.padEnd(8)} ${diagnostic.rule}`);
        lines.push(`             ${diagnostic.message}`);

        for (const detail of formatDiagnosticDetails(diagnostic, true)) {
          lines.push(`             ${detail}`);
        }

        lines.push('');
        continue;
      }

      const suffix = diagnostic.path ? `  [${diagnostic.path}]` : '';
      lines.push(`  ${icon} ${severityText.padEnd(8)} ${diagnostic.rule.padEnd(30)} ${diagnostic.message}${suffix}`);
    }

    lines.push('');
  }

  lines.push(renderSectionHeading('Summary'));
  lines.push(`  ${colors.bold(formatValidationSummaryLine(summary))}`);

  return lines.join('\n');
}
