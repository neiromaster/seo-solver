import type { ComparisonSummary, DiffEntry, DiffKind } from '@seo-solver/types/compare';
import type { ValidationSummary } from '@seo-solver/types/report';
import type { Diagnostic, Severity } from '@seo-solver/types/validate';
import { formatFullValue } from './truncate.js';

const TYPE_LABELS: Record<string, string> = {
  canonical: 'Canonical',
  headings: 'Headings',
  jsonld: 'JSON-LD',
  meta: 'Meta',
  opengraph: 'OpenGraph',
  'robots-txt': 'Robots.txt',
};

export function formatTypeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type;
}

export function formatStatus(statusCode: number): string {
  const label = statusCode >= 200 && statusCode < 300 ? 'OK' : 'Status';
  return `${statusCode} ${label}`;
}

export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);

  if (Number.isNaN(date.valueOf())) {
    return timestamp;
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes} UTC`;
}

export function getReportTitle(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export function formatValidationSummaryLine(summary: ValidationSummary): string {
  return `${summary.errors} errors · ${summary.warnings} warnings · ${summary.info} info`;
}

export function formatComparisonSummaryLine(summary: ComparisonSummary): string {
  return `${summary.changed} changed · ${summary.added} added · ${summary.removed} removed · ${summary.identical} identical`;
}

export function formatSeverityIcon(severity: Severity): string {
  if (severity === 'error') {
    return '✗';
  }

  if (severity === 'warning') {
    return '⚠';
  }

  return 'ℹ';
}

export function formatSeverityLabel(severity: Severity): string {
  if (severity === 'error') {
    return 'Error';
  }

  if (severity === 'warning') {
    return 'Warning';
  }

  return 'Info';
}

export function formatDiffIcon(kind: DiffKind): string {
  if (kind === 'added') {
    return '+';
  }

  if (kind === 'removed') {
    return '-';
  }

  return '~';
}

export function formatDiffLabel(kind: DiffKind): string {
  if (kind === 'added') {
    return 'Added';
  }

  if (kind === 'removed') {
    return 'Removed';
  }

  return 'Changed';
}

export function renderSectionHeading(title: string): string {
  const prefix = `── ${title} `;
  const width = 56;
  return `${prefix}${'─'.repeat(Math.max(0, width - prefix.length))}`;
}

export function escapeMarkdownTableCell(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\r?\n/g, '<br />');
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatDiagnosticDetails(diagnostic: Diagnostic, verbose: boolean): string[] {
  const lines: string[] = [];

  const renderDetailValue = (value: unknown): string => {
    if (typeof value === 'string') {
      return value.replace(/\r?\n/g, '\\n');
    }

    return formatFullValue(value);
  };

  if (diagnostic.path) {
    lines.push(`path:     ${diagnostic.path}`);
  }

  if (diagnostic.expected !== undefined) {
    lines.push(`expected: ${renderDetailValue(diagnostic.expected)}`);
  }

  if (diagnostic.actual !== undefined) {
    lines.push(`actual:   ${renderDetailValue(diagnostic.actual)}`);

    if (
      verbose &&
      typeof diagnostic.actual !== 'number' &&
      typeof diagnostic.actual !== 'boolean' &&
      diagnostic.actual !== null
    ) {
      lines.push(`value:    ${formatFullValue(diagnostic.actual)}`);
    }
  }

  return lines;
}

export function formatDiffPath(entry: DiffEntry): string {
  return entry.path === '' ? '(entire type)' : entry.path;
}
