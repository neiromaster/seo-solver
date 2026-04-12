import type { DiffEntry } from '@seo-solver/types/compare';
import { appendArrayPath, appendObjectPath } from './utils/path.js';

export type DiffOptions = {
  pathPrefix?: string;
  ignoreArrayOrder?: boolean;
};

export function diff(a: unknown, b: unknown, options: DiffOptions = {}): DiffEntry[] {
  return diffValue(a, b, options.pathPrefix ?? '', options.ignoreArrayOrder ?? false);
}

function diffValue(a: unknown, b: unknown, path: string, ignoreArrayOrder: boolean): DiffEntry[] {
  if (deepEqual(a, b)) {
    return [];
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    return ignoreArrayOrder ? diffArrayIgnoringOrder(a, b, path) : diffArrayByIndex(a, b, path, ignoreArrayOrder);
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    return diffObject(a, b, path, ignoreArrayOrder);
  }

  return [{ kind: 'changed', path, before: a, after: b }];
}

function diffObject(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
  path: string,
  ignoreArrayOrder: boolean,
): DiffEntry[] {
  const diffs: DiffEntry[] = [];

  for (const key of Object.keys(a)) {
    const nextPath = appendObjectPath(path, key);
    if (!(key in b)) {
      diffs.push({ kind: 'removed', path: nextPath, before: a[key] });
      continue;
    }

    diffs.push(...diffValue(a[key], b[key], nextPath, ignoreArrayOrder));
  }

  for (const key of Object.keys(b)) {
    if (key in a) {
      continue;
    }

    diffs.push({ kind: 'added', path: appendObjectPath(path, key), after: b[key] });
  }

  return diffs;
}

function diffArrayByIndex(a: unknown[], b: unknown[], path: string, ignoreArrayOrder: boolean): DiffEntry[] {
  const diffs: DiffEntry[] = [];
  const sharedLength = Math.min(a.length, b.length);

  for (let index = 0; index < sharedLength; index += 1) {
    diffs.push(...diffValue(a[index], b[index], appendArrayPath(path, index), ignoreArrayOrder));
  }

  for (let index = sharedLength; index < a.length; index += 1) {
    diffs.push({ kind: 'removed', path: appendArrayPath(path, index), before: a[index] });
  }

  for (let index = sharedLength; index < b.length; index += 1) {
    diffs.push({ kind: 'added', path: appendArrayPath(path, index), after: b[index] });
  }

  return diffs;
}

function diffArrayIgnoringOrder(a: unknown[], b: unknown[], path: string): DiffEntry[] {
  const diffs: DiffEntry[] = [];
  const remainingB = new Set(b.map((_, index) => index));
  const matchedA = new Set<number>();
  const pairedEntries: Array<{ indexA: number; indexB: number }> = [];

  for (let indexA = 0; indexA < a.length; indexA += 1) {
    const indexB = Array.from(remainingB).find((candidate) => deepEqual(a[indexA], b[candidate]));
    if (indexB === undefined) {
      continue;
    }

    matchedA.add(indexA);
    remainingB.delete(indexB);
    pairedEntries.push({ indexA, indexB });
  }

  const unmatchedA = a.map((value, index) => ({ value, index })).filter((entry) => !matchedA.has(entry.index));

  for (const entryA of unmatchedA) {
    const indexB = findBestOrderInsensitiveMatch(entryA.value, b, remainingB);
    if (indexB === undefined) {
      continue;
    }

    matchedA.add(entryA.index);
    remainingB.delete(indexB);
    pairedEntries.push({ indexA: entryA.index, indexB });
  }

  for (const pair of pairedEntries.sort((left, right) => left.indexA - right.indexA)) {
    diffs.push(...diffValue(a[pair.indexA], b[pair.indexB], appendArrayPath(path, pair.indexA), true));
  }

  for (let index = 0; index < a.length; index += 1) {
    if (matchedA.has(index)) {
      continue;
    }

    diffs.push({ kind: 'removed', path: appendArrayPath(path, index), before: a[index] });
  }

  for (const index of remainingB) {
    diffs.push({ kind: 'added', path: appendArrayPath(path, index), after: b[index] });
  }

  return diffs;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) {
    return true;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }

    return a.every((entry, index) => deepEqual(entry, b[index]));
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    const keysA = Object.keys(a).sort();
    const keysB = Object.keys(b).sort();

    if (keysA.length !== keysB.length) {
      return false;
    }

    return keysA.every((key, index) => key === keysB[index] && deepEqual(a[key], b[key]));
  }

  return false;
}

function findBestOrderInsensitiveMatch(
  valueA: unknown,
  valuesB: unknown[],
  remainingB: Set<number>,
): number | undefined {
  let bestIndex: number | undefined;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const indexB of remainingB) {
    const score = similarityScore(valueA, valuesB[indexB]);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = indexB;
    }
  }

  return bestScore > 0 ? bestIndex : undefined;
}

function similarityScore(a: unknown, b: unknown): number {
  if (deepEqual(a, b)) {
    return Number.POSITIVE_INFINITY;
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    const sharedKeys = Object.keys(a).filter((key) => key in b);
    if (sharedKeys.length === 0) {
      return Number.NEGATIVE_INFINITY;
    }

    return sharedKeys.reduce((score, key) => score + (deepEqual(a[key], b[key]) ? 2 : 1), 0);
  }

  return Number.NEGATIVE_INFINITY;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
