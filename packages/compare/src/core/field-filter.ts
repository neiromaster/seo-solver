import type { DiffEntry } from '@seo-solver/types/compare';

export function filterDiffs(diffs: DiffEntry[], ignoreFields: string[] = []): DiffEntry[] {
  if (ignoreFields.length === 0) {
    return diffs;
  }

  return diffs.filter((entry) => !ignoreFields.some((ignoreField) => isIgnoredPath(entry.path, ignoreField)));
}

function isIgnoredPath(path: string, ignoreField: string): boolean {
  return path === ignoreField || path.startsWith(`${ignoreField}.`) || path.startsWith(`${ignoreField}[`);
}
