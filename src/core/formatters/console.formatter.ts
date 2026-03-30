import { buildFlatDiffLines as buildFlatDiffLinesDefault, printLines } from '#core/comparers/helpers';
import type { FlatData } from '#types';

export { buildFlatDiffLines } from '#core/comparers/helpers';

export function printFlatDiff(a: FlatData, b: FlatData): void {
  printLines(buildFlatDiffLinesDefault(a, b));
}
