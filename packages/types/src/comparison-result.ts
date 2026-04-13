import type { DiffEntry } from './diff-entry';

export type ComparisonResult = {
  type: string;
  sourceA: string;
  sourceB: string;
  diffs: DiffEntry[];
};
