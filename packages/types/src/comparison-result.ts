import type { DiffEntry } from './diff-entry.js';

export type ComparisonResult = {
  type: string;
  sourceA: string;
  sourceB: string;
  diffs: DiffEntry[];
};
