import type { Comparator, DiffEntry, ExtractionEnvelope, HeadingEntry } from '@seo-solver/types';

export class HeadingsComparator implements Comparator {
  readonly type = 'headings';

  compare(a: ExtractionEnvelope, b: ExtractionEnvelope): DiffEntry[] {
    const headingsA = asHeadings(a.data);
    const headingsB = asHeadings(b.data);
    return buildAlignment(headingsA, headingsB);
  }
}

function asHeadings(value: unknown): HeadingEntry[] {
  return Array.isArray(value) ? (value as HeadingEntry[]) : [];
}

function sameHeading(a: HeadingEntry, b: HeadingEntry): boolean {
  return a.level === b.level && a.text === b.text;
}

function buildAlignment(headingsA: HeadingEntry[], headingsB: HeadingEntry[]): DiffEntry[] {
  const costs = Array.from({ length: headingsA.length + 1 }, () => Array<number>(headingsB.length + 1).fill(0));

  for (let indexA = 1; indexA <= headingsA.length; indexA += 1) {
    costs[indexA]![0] = indexA;
  }

  for (let indexB = 1; indexB <= headingsB.length; indexB += 1) {
    costs[0]![indexB] = indexB;
  }

  for (let indexA = 1; indexA <= headingsA.length; indexA += 1) {
    for (let indexB = 1; indexB <= headingsB.length; indexB += 1) {
      const headingA = headingsA[indexA - 1]!;
      const headingB = headingsB[indexB - 1]!;
      const substitutionCost = costs[indexA - 1]![indexB - 1]! + updateCost(headingA, headingB);
      const insertionCost = costs[indexA]![indexB - 1]! + 1;
      const removalCost = costs[indexA - 1]![indexB]! + 1;
      costs[indexA]![indexB] = Math.min(substitutionCost, insertionCost, removalCost);
    }
  }

  const diffs: DiffEntry[] = [];
  let indexA = headingsA.length;
  let indexB = headingsB.length;

  while (indexA > 0 || indexB > 0) {
    const headingA = indexA > 0 ? headingsA[indexA - 1] : undefined;
    const headingB = indexB > 0 ? headingsB[indexB - 1] : undefined;

    if (
      headingA &&
      headingB &&
      costs[indexA]![indexB] === costs[indexA - 1]![indexB - 1]! + updateCost(headingA, headingB)
    ) {
      if (!sameHeading(headingA, headingB)) {
        if (headingA.level !== headingB.level) {
          diffs.push({ kind: 'changed', path: `[${indexA - 1}].level`, before: headingA.level, after: headingB.level });
        }

        if (headingA.text !== headingB.text) {
          diffs.push({ kind: 'changed', path: `[${indexA - 1}].text`, before: headingA.text, after: headingB.text });
        }
      }

      indexA -= 1;
      indexB -= 1;
      continue;
    }

    if (headingB && costs[indexA]![indexB] === costs[indexA]![indexB - 1]! + 1) {
      diffs.push({ kind: 'added', path: `[${indexB - 1}]`, after: headingB });
      indexB -= 1;
      continue;
    }

    if (headingA) {
      diffs.push({ kind: 'removed', path: `[${indexA - 1}]`, before: headingA });
      indexA -= 1;
    }
  }

  return diffs.reverse();
}

function updateCost(a: HeadingEntry, b: HeadingEntry): number {
  if (sameHeading(a, b)) {
    return 0;
  }

  if (a.level === b.level || a.text === b.text) {
    return 1;
  }

  return 2;
}
