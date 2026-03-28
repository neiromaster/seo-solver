import { bold, green, red } from 'ansis';
import { compareFlat } from '#core/comparers';
import type { FlatData } from '#types';

export function printFlatDiff(a: FlatData, b: FlatData): void {
  const { diffs, added, removed } = compareFlat(a, b);
  if (diffs.length + added.length + removed.length === 0) {
    console.log(`${green`✓ identical`}\n`);
    return;
  }
  for (const { key, a: va, b: vb } of diffs) {
    console.log(`  ${bold(key)}`);
    console.log(`    ${red`- ${va}`}`);
    console.log(`    ${green`+ ${vb}`}`);
  }
  for (const k of removed) console.log(`  ${red`- ${k}: ${a[k] ?? ''}`}`);
  for (const k of added) console.log(`  ${green`+ ${k}: ${b[k] ?? ''}`}`);
  console.log();
}
