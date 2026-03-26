import type { FlatData, Schema } from '#types';

export function flatten(obj: Schema, prefix = ''): FlatData {
  return Object.entries(obj).reduce<FlatData>((acc, [k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(acc, flatten(v as Schema, key));
    } else {
      acc[key] = Array.isArray(v) ? JSON.stringify(v) : v === null ? 'null' : String(v ?? '');
    }
    return acc;
  }, {});
}
