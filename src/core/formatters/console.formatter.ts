import { bold, green, red } from 'ansis';
import { compareFlat } from '#core/comparers/helpers';
import type { FlatData } from '#types';

export function buildFlatDiffLines(a: FlatData, b: FlatData): string[] {
  const { diffs, added, removed } = compareFlat(a, b);
  if (diffs.length + added.length + removed.length === 0) {
    return [`${green`✓ identical`}\n`];
  }
  const lines: string[] = [];
  for (const { key, a: va, b: vb } of diffs) {
    lines.push(`  ${bold(key)}`);
    lines.push(`    ${red`- ${va}`}`);
    lines.push(`    ${green`+ ${vb}`}`);
  }
  for (const k of removed) lines.push(`  ${red`- ${k}: ${a[k] ?? ''}`}`);
  for (const k of added) lines.push(`  ${green`+ ${k}: ${b[k] ?? ''}`}`);
  lines.push('');
  return lines;
}

export function printFlatDiff(a: FlatData, b: FlatData): void {
  for (const line of buildFlatDiffLines(a, b)) {
    if (line === '') {
      console.log();
    } else {
      console.log(line);
    }
  }
}
