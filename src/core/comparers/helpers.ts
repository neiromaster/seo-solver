import { bold, green, red } from 'ansis';
import type { FlatData, Schema } from '#types';

export function normalizeFlatValue(value: string | string[] | undefined): string {
  if (value === undefined) return '';
  return Array.isArray(value) ? value.join(', ') : value;
}

export function groupByType(schemas: Schema[]): Map<string, Schema[]> {
  const groups = new Map<string, Schema[]>();
  for (const schema of schemas) {
    const rawType = schema['@type'];
    const type = rawType == null ? '__NO_TYPE__' : Array.isArray(rawType) ? String(rawType[0]) : String(rawType);
    const list = groups.get(type);
    if (list) {
      list.push(schema);
    } else {
      groups.set(type, [schema]);
    }
  }
  return groups;
}

export type FlatDiffResult = {
  diffs: Array<{ key: string; a: string; b: string }>;
  added: string[];
  removed: string[];
};

export function compareFlat(a: FlatData, b: FlatData): FlatDiffResult {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const diffs: Array<{ key: string; a: string; b: string }> = [];
  const added: string[] = [];
  const removed: string[] = [];
  for (const k of keys) {
    const va = a[k];
    const vb = b[k];
    if (va === undefined) added.push(k);
    else if (vb === undefined) removed.push(k);
    else {
      const left = normalizeFlatValue(va);
      const right = normalizeFlatValue(vb);
      if (left !== right) diffs.push({ key: k, a: left, b: right });
    }
  }
  return { diffs, added, removed };
}

export function buildFlatDiffLines(a: FlatData, b: FlatData): string[] {
  const { diffs, added, removed } = compareFlat(a, b);
  if (diffs.length + added.length + removed.length === 0) {
    return [`${green`✓ identical`}`, ''];
  }

  const lines: string[] = [];
  for (const { key, a: va, b: vb } of diffs) {
    lines.push(`  ${bold(key)}`);
    lines.push(`    ${red`- ${va}`}`);
    lines.push(`    ${green`+ ${vb}`}`);
  }
  for (const k of removed) lines.push(`  ${red`- ${k}: ${normalizeFlatValue(a[k])}`}`);
  for (const k of added) lines.push(`  ${green`+ ${k}: ${normalizeFlatValue(b[k])}`}`);
  lines.push('');
  return lines;
}

export function printLines(lines: string[]): void {
  for (const line of lines) {
    if (line === '') {
      console.log();
    } else {
      console.log(line);
    }
  }
}
