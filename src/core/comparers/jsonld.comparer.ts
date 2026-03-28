import { bold, dim, green, red, yellow } from 'ansis';
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
    const typeLabel = type === '__NO_TYPE__' ? dim`(no @type)` : type;

    if (count2 === 0) {
      console.log(`${red`- ${typeLabel}`} (${count1} in URL1)`);
      for (let i = 0; i < schemas1.length; i++) {
        const suffix = count1 > 1 ? ` [#${i + 1}]` : '';
        for (const [k, v] of Object.entries(flatten(schemas1[i] as Schema)))
          console.log(`  ${red`-${suffix} ${k}: ${v}`}`);
      }
      console.log();
      continue;
    }

    if (count1 === 0) {
      console.log(`${green`+ ${typeLabel}`} (${count2} in URL2)`);
      for (let i = 0; i < schemas2.length; i++) {
        const suffix = count2 > 1 ? ` [#${i + 1}]` : '';
        for (const [k, v] of Object.entries(flatten(schemas2[i] as Schema)))
          console.log(`  ${green`+${suffix} ${k}: ${v}`}`);
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
          console.log(`${yellow`~ ${typeLabel}`} (${count1} vs ${count2})`);
          hasDifferences = true;
        }
        for (const [k, v] of Object.entries(flatten(a as Schema))) console.log(`  ${red`-${suffix} ${k}: ${v}`}`);
        continue;
      }
      if (!a) {
        if (!hasDifferences) {
          console.log(`${yellow`~ ${typeLabel}`} (${count1} vs ${count2})`);
          hasDifferences = true;
        }
        for (const [k, v] of Object.entries(flatten(b as Schema))) console.log(`  ${green`+${suffix} ${k}: ${v}`}`);
        continue;
      }

      const fa = flatten(a),
        fb = flatten(b);
      const { diffs, added, removed } = compareFlat(fa, fb);
      if (diffs.length + added.length + removed.length > 0) {
        if (!hasDifferences) {
          console.log(`${yellow`~ ${typeLabel}`} (${count1} vs ${count2})`);
          hasDifferences = true;
        }
        for (const { key, a: va, b: vb } of diffs) {
          console.log(`  ${bold(key + suffix)}`);
          console.log(`    ${red`- ${va}`}`);
          console.log(`    ${green`+ ${vb}`}`);
        }
        for (const k of removed) console.log(`  ${red`-${suffix} ${k}: ${fa[k] ?? ''}`}`);
        for (const k of added) console.log(`  ${green`+${suffix} ${k}: ${fb[k] ?? ''}`}`);
      }
    }

    if (!hasDifferences) {
      console.log(`${green`✓ ${typeLabel}`} — identical (${count1})\n`);
    } else {
      console.log();
    }
  }
}
