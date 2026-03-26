import type { FlatData, Schema } from '#types';

export function groupByType(schemas: Schema[]): Map<string, Schema[]> {
  const groups = new Map<string, Schema[]>();
  for (const schema of schemas) {
    const type = String(schema['@type'] ?? 'undefined');
    const list = groups.get(type);
    if (list) {
      list.push(schema);
    } else {
      groups.set(type, [schema]);
    }
  }
  return groups;
}

export function compareFlat(a: FlatData, b: FlatData) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const diffs: Array<{ key: string; a: string; b: string }> = [];
  const added: string[] = [];
  const removed: string[] = [];
  for (const k of keys) {
    const va = a[k];
    const vb = b[k];
    if (va === undefined) added.push(k);
    else if (vb === undefined) removed.push(k);
    else if (va !== vb) diffs.push({ key: k, a: va, b: vb });
  }
  return { diffs, added, removed };
}
