import type { ReporterConfig, ValidationReport } from '@seo-solver/types';
import { filterDiagnosticsBySeverity } from '../../filter.js';
import { summarizeValidation } from '../../summary.js';
import {
  escapeMarkdownTableCell,
  formatSeverityIcon,
  formatSeverityLabel,
  formatStatus,
  formatTimestamp,
  formatTypeLabel,
  getReportTitle,
} from '../../utils/text.js';

function formatDetailsSummary(count: number): string {
  return `${count} ${count === 1 ? 'issue' : 'issues'} found`;
}

export function formatMarkdownValidation(report: ValidationReport, config: ReporterConfig): string {
  const summary = summarizeValidation(report);
  const lines = [
    `# SEO Audit: ${getReportTitle(report.url)}`,
    '',
    `**URL:** ${report.url}`,
    `**Status:** ${formatStatus(report.fetch.statusCode)} (${report.fetch.timing}ms)`,
    `**Date:** ${formatTimestamp(report.timestamp)}`,
    '',
    '## Summary',
    '',
    '| Severity | Count |',
    '|----------|-------|',
    `| Errors | ${summary.errors} |`,
    `| Warnings | ${summary.warnings} |`,
    `| Info | ${summary.info} |`,
  ];

  for (const validation of report.validations) {
    const visibleDiagnostics = filterDiagnosticsBySeverity(validation.diagnostics, config.minSeverity ?? 'info');
    const hasHiddenDiagnostics = validation.diagnostics.length > 0 && visibleDiagnostics.length === 0;

    lines.push('', `## ${formatTypeLabel(validation.type)}`, '');

    if (visibleDiagnostics.length === 0) {
      if (hasHiddenDiagnostics) {
        lines.push('_No visible diagnostics at current minSeverity._');
        continue;
      }

      lines.push('✅ All checks passed');
      continue;
    }

    const block = [
      '| Severity | Rule | Message |',
      '|----------|------|---------|',
      ...visibleDiagnostics.map(
        (diagnostic) =>
          `| ${formatSeverityIcon(diagnostic.severity)} ${formatSeverityLabel(diagnostic.severity)} | \`${escapeMarkdownTableCell(
            diagnostic.rule,
          )}\` | ${escapeMarkdownTableCell(diagnostic.message)} |`,
      ),
    ];

    if (config.markdownCollapsible ?? true) {
      lines.push('<details>');
      lines.push(`<summary>${formatDetailsSummary(visibleDiagnostics.length)}</summary>`);
      lines.push('');
      lines.push(...block);
      lines.push('');
      lines.push('</details>');
    } else {
      lines.push(...block);
    }
  }

  return lines.join('\n');
}
