import { BOLD, DIM, GREEN, RED, RESET } from '#lib/colors';
import type { OgData } from '#types';
import { compareFlat } from './helpers';

export function compareOg(og1: OgData, og2: OgData): void {
  if (Object.keys(og1).length === 0 && Object.keys(og2).length === 0) {
    console.log(`${DIM}No OpenGraph tags found${RESET}\n`);
    return;
  }
  printFlatDiff(og1, og2);
}

function printFlatDiff(a: OgData, b: OgData): void {
  const { diffs, added, removed } = compareFlat(a, b);
  if (diffs.length + added.length + removed.length === 0) {
    console.log(`${GREEN}✓ identical${RESET}\n`);
    return;
  }
  for (const { key, a: va, b: vb } of diffs) {
    console.log(`  ${BOLD}${key}${RESET}`);
    console.log(`    ${RED}- ${va}${RESET}`);
    console.log(`    ${GREEN}+ ${vb}${RESET}`);
  }
  for (const k of removed) console.log(`  ${RED}- ${k}: ${a[k] ?? ''}${RESET}`);
  for (const k of added) console.log(`  ${GREEN}+ ${k}: ${b[k] ?? ''}${RESET}`);
  console.log();
}
