import { JsonParseError, NoDataFoundError } from '#core/errors';
import type { Schema } from '#types';

export function extractSchemasFromHtml(html: string, url: string): Schema[] {
  const texts = [
    ...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
  ].flatMap((m) => (m[1] !== undefined ? [m[1]] : []));

  if (texts.length === 0) {
    throw new NoDataFoundError(url, 'schemas');
  }

  let lastError: unknown;
  const schemas = texts
    .map((t) => {
      try {
        return JSON.parse(t) as unknown;
      } catch (e) {
        lastError = e;
        return null;
      }
    })
    .filter((value) => value !== null);

  if (schemas.length === 0) {
    throw new JsonParseError(url, lastError);
  }

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
