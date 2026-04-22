import type { DiffEntry } from '@seo-solver/types/compare';
import { type DiffOptions, diff } from './diff.js';
import { filterDiffs } from './field-filter.js';

export type CompareObjectsOptions = DiffOptions & {
  ignoreFields?: string[] | undefined;
};

export type CompareObjectsResult = {
  diffs: DiffEntry[];
};

export function compareObjects(a: unknown, b: unknown, options: CompareObjectsOptions = {}): CompareObjectsResult {
  const diffs = diff(a, b, options);

  return {
    diffs: filterDiffs(diffs, options.ignoreFields),
  };
}
