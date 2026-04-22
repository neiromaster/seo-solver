import type { DiffEntry } from '@seo-solver/types/compare';
import type { Comparator } from '@seo-solver/types/compare-advanced';
import type { HeadingEntry } from '@seo-solver/types/extract';
import type { ExtractionEnvelope } from '@seo-solver/types/extract-advanced';
import { diffHeadings } from '../headings/diff-headings.js';

export class HeadingsComparator implements Comparator {
  readonly type = 'headings';

  compare(a: ExtractionEnvelope, b: ExtractionEnvelope): DiffEntry[] {
    const headingsA = asHeadings(a.data);
    const headingsB = asHeadings(b.data);
    return diffHeadings(headingsA, headingsB);
  }
}

function asHeadings(value: unknown): HeadingEntry[] {
  return Array.isArray(value) ? (value as HeadingEntry[]) : [];
}
