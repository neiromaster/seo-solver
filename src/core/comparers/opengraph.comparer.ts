import { dim } from 'ansis';
import { buildFlatDiffLines } from '#core/formatters/console.formatter';
import type { OgData } from '#types';

export function buildOgComparisonLines(og1: OgData, og2: OgData): string[] {
  if (Object.keys(og1).length === 0 && Object.keys(og2).length === 0) {
    return [`${dim`No OpenGraph tags found`}\n`];
  }
  return buildFlatDiffLines(og1, og2);
}

export function compareOg(og1: OgData, og2: OgData): void {
  for (const line of buildOgComparisonLines(og1, og2)) {
    if (line === '') {
      console.log();
    } else {
      console.log(line);
    }
  }
}
