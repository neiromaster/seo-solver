import { BOLD, DIM, GREEN, RED, RESET, YELLOW } from '#lib/colors';
import { flatten } from '#lib/flatten';
import type { Schema } from '#types';
import { compareFlat, groupByType } from './helpers';

export function compareJsonLd(s1: Schema[], s2: Schema[]): void {
  const g1 = groupByType(s1);
  const g2 = groupByType(s2);
  const allTypes = [...new Set([...g1.keys(), ...g2.keys()])];

  for (const type of allTypes) {
    const schemas1 = g1.get(type) ?? [];
    const schemas2 = g2.get(type) ?? [];
    const count1 = schemas1.length;
    const count2 = schemas2.length;
    const typeLabel = type === 'undefined' ? `${DIM}(no @type)${RESET}` : type;

    if (count2 === 0) {
      console.log(`${RED}- ${typeLabel}${RESET} (${count1} in URL1)`);
      for (let i = 0; i < schemas1.length; i++) {
        const suffix = count1 > 1 ? ` [#${i + 1}]` : '';
        for (const [k, v] of Object.entries(flatten(schemas1[i] as Schema)))
          console.log(`  ${RED}-${suffix} ${k}: ${v}${RESET}`);
      }
      console.log();
      continue;
    }

    if (count1 === 0) {
      console.log(`${GREEN}+ ${typeLabel}${RESET} (${count2} in URL2)`);
      for (let i = 0; i < schemas2.length; i++) {
        const suffix = count2 > 1 ? ` [#${i + 1}]` : '';
        for (const [k, v] of Object.entries(flatten(schemas2[i] as Schema)))
          console.log(`  ${GREEN}+${suffix} ${k}: ${v}${RESET}`);
      }
      console.log();
      continue;
    }

    const maxCount = Math.max(count1, count2);
    let hasDifferences = false;

    for (let i = 0; i < maxCount; i++) {
      const a = schemas1[i];
      const b = schemas2[i];
      const suffix = maxCount > 1 ? ` [#${i + 1}]` : '';

      if (!b) {
        if (!hasDifferences) {
          console.log(`${YELLOW}~ ${typeLabel}${RESET} (${count1} vs ${count2})`);
          hasDifferences = true;
        }
        for (const [k, v] of Object.entries(flatten(a as Schema))) console.log(`  ${RED}-${suffix} ${k}: ${v}${RESET}`);
        continue;
      }
      if (!a) {
        if (!hasDifferences) {
          console.log(`${YELLOW}~ ${typeLabel}${RESET} (${count1} vs ${count2})`);
          hasDifferences = true;
        }
        for (const [k, v] of Object.entries(flatten(b as Schema)))
          console.log(`  ${GREEN}+${suffix} ${k}: ${v}${RESET}`);
        continue;
      }

      const fa = flatten(a),
        fb = flatten(b);
      const { diffs, added, removed } = compareFlat(fa, fb);
      if (diffs.length + added.length + removed.length > 0) {
        if (!hasDifferences) {
          console.log(`${YELLOW}~ ${typeLabel}${RESET} (${count1} vs ${count2})`);
          hasDifferences = true;
        }
        for (const { key, a: va, b: vb } of diffs) {
          console.log(`  ${BOLD}${key}${suffix}${RESET}`);
          console.log(`    ${RED}- ${va}${RESET}`);
          console.log(`    ${GREEN}+ ${vb}${RESET}`);
        }
        for (const k of removed) console.log(`  ${RED}-${suffix} ${k}: ${fa[k] ?? ''}${RESET}`);
        for (const k of added) console.log(`  ${GREEN}+${suffix} ${k}: ${fb[k] ?? ''}${RESET}`);
      }
    }

    if (!hasDifferences) {
      console.log(`${GREEN}✓ ${typeLabel}${RESET} — identical (${count1})\n`);
    } else {
      console.log();
    }
  }
}
