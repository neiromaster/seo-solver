import type { DiffEntry } from '@seo-solver/types/compare';
import type { HeadingEntry } from '@seo-solver/types/extract';

export function diffHeadings(headingsA: HeadingEntry[], headingsB: HeadingEntry[]): DiffEntry[] {
  const costs = Array.from({ length: headingsA.length + 1 }, () => Array<number>(headingsB.length + 1).fill(0));

  for (let indexA = 1; indexA <= headingsA.length; indexA += 1) {
    setCost(costs, indexA, 0, indexA);
  }

  for (let indexB = 1; indexB <= headingsB.length; indexB += 1) {
    setCost(costs, 0, indexB, indexB);
  }

  for (let indexA = 1; indexA <= headingsA.length; indexA += 1) {
    for (let indexB = 1; indexB <= headingsB.length; indexB += 1) {
      const headingA = getHeading(headingsA, indexA - 1);
      const headingB = getHeading(headingsB, indexB - 1);
      const substitutionCost = getCost(costs, indexA - 1, indexB - 1) + updateCost(headingA, headingB);
      const insertionCost = getCost(costs, indexA, indexB - 1) + 1;
      const removalCost = getCost(costs, indexA - 1, indexB) + 1;
      setCost(costs, indexA, indexB, Math.min(substitutionCost, insertionCost, removalCost));
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
      getCost(costs, indexA, indexB) === getCost(costs, indexA - 1, indexB - 1) + updateCost(headingA, headingB)
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

    if (headingB && getCost(costs, indexA, indexB) === getCost(costs, indexA, indexB - 1) + 1) {
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

function sameHeading(a: HeadingEntry, b: HeadingEntry): boolean {
  return a.level === b.level && a.text === b.text;
}

function getHeading(headings: HeadingEntry[], index: number): HeadingEntry {
  const heading = headings[index];
  if (heading === undefined) {
    throw new Error(`Expected heading at index ${index}`);
  }
  return heading;
}

function getCost(costs: number[][], rowIndex: number, columnIndex: number): number {
  const row = costs[rowIndex];
  if (row === undefined) {
    throw new Error(`Expected cost row ${rowIndex}`);
  }

  const value = row[columnIndex];
  if (value === undefined) {
    throw new Error(`Expected cost value at [${rowIndex}, ${columnIndex}]`);
  }

  return value;
}

function setCost(costs: number[][], rowIndex: number, columnIndex: number, value: number): void {
  const row = costs[rowIndex];
  if (row === undefined) {
    throw new Error(`Expected cost row ${rowIndex}`);
  }

  row[columnIndex] = value;
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
