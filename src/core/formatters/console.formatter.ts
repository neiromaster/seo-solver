import { compareFlat } from '#core/comparers';
import { BOLD, GREEN, RED, RESET } from '#lib/colors';
import type { FlatData } from '#types';

export function printFlatDiff(a: FlatData, b: FlatData): void {
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
