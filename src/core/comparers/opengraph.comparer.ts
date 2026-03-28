import { bold, dim, green, red } from 'ansis';
import type { OgData } from '#types';
import { compareFlat } from './helpers';

export function compareOg(og1: OgData, og2: OgData): void {
  if (Object.keys(og1).length === 0 && Object.keys(og2).length === 0) {
    console.log(`${dim`No OpenGraph tags found`}\n`);
    return;
  }
  printFlatDiff(og1, og2);
}

function printFlatDiff(a: OgData, b: OgData): void {
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
