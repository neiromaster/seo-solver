import type { ReporterConfig } from '@seo-solver/types/report';
import type { ValidationReport } from '@seo-solver/types/validate';
import { filterDiagnosticsBySeverity } from '../../filter.js';
import { groupDiagnostics, summarizeValidation } from '../../summary.js';
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

    const groups = groupDiagnostics(visibleDiagnostics);
    const block = [
      '| Severity | Rule | Message |',
      '|----------|------|---------|',
      ...groups.map(
        (group) =>
          `| ${formatSeverityIcon(group.severity)} ${formatSeverityLabel(group.severity)} | \`${escapeMarkdownTableCell(
            `${group.rule}${group.count > 1 ? ` ×${group.count}` : ''}`,
          )}\` | ${escapeMarkdownTableCell([group.message, ...group.paths.map((path) => `- ${path}`)].join('\n'))} |`,
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
