import type { ComparisonResult } from '@seo-solver/types/compare';
import type { HeadingEntry } from '@seo-solver/types/extract';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isHeadingsComparison(comparison: ComparisonResult): boolean {
  return comparison.type === 'headings';
}

export function isHeadingEntry(value: unknown): value is HeadingEntry {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.level === 'number' && typeof value.text === 'string';
}

export function formatHeadingEntry(value: HeadingEntry): string {
  return `h${value.level}: ${JSON.stringify(value.text)}`;
}
