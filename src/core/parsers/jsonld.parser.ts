import type { Schema } from '#types';

export function extractSchemasFromHtml(html: string): Schema[] {
  const texts = [
    ...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
  ].flatMap((m) => (m[1] !== undefined ? [m[1]] : []));
  const schemas = texts
    .map((t) => {
      try {
        return JSON.parse(t) as unknown;
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  return normalizeSchemas(schemas);
}

export function normalizeSchemas(schemas: unknown[]): Schema[] {
  const result: Schema[] = [];
  for (const item of schemas) {
    if (Array.isArray(item)) {
      result.push(...normalizeSchemas(item as unknown[]));
      continue;
    }
    if (!item || typeof item !== 'object') continue;
    const s = item as Schema;
    if (s['@graph'] && Array.isArray(s['@graph'])) {
      result.push(...normalizeSchemas(s['@graph'] as unknown[]));
      continue;
    }
    if (Array.isArray(s['@type'])) {
      for (const type of s['@type'] as string[]) result.push({ ...s, '@type': type });
      continue;
    }
    result.push(s);
  }
  return result;
}
