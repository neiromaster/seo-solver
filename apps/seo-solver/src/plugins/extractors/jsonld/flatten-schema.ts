import type { JsonLdSchema } from './jsonld-extractor';

export function flattenSchema(schema: JsonLdSchema, prefix = ''): Record<string, string> {
  return Object.entries(schema).reduce<Record<string, string>>((result, [key, value]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenSchema(value as JsonLdSchema, nextKey));
      return result;
    }

    result[nextKey] = Array.isArray(value) ? JSON.stringify(value) : value === null ? 'null' : String(value ?? '');
    return result;
  }, {});
}
