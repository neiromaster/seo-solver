import { AppError, type ExtractedDocument, type Extractor, type FetchedSource } from '#kernel';

export type JsonLdSchema = Record<string, unknown>;

export class JsonLdExtractor implements Extractor<JsonLdSchema[]> {
  readonly id = 'jsonld';
  readonly kind = 'jsonld';

  canExtract(input: FetchedSource): boolean {
    return input.body.includes('application/ld+json');
  }

  async extract(input: FetchedSource): Promise<ExtractedDocument<JsonLdSchema[]>> {
    const texts = [
      ...input.body.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
    ].flatMap((match) => (match[1] !== undefined ? [match[1]] : []));

    if (texts.length === 0) {
      throw new AppError(`No JSON-LD found in ${input.source.url}`);
    }

    let lastError: unknown;
    const parsed = texts
      .map((text) => {
        try {
          return JSON.parse(text) as unknown;
        } catch (error) {
          lastError = error;
          return null;
        }
      })
      .filter((value): value is unknown => value !== null);

    if (parsed.length === 0) {
      throw new AppError(`Failed to parse JSON-LD in ${input.source.url}`, { cause: lastError });
    }

    const data = normalizeJsonLd(parsed);

    return {
      extractorId: this.id,
      kind: this.kind,
      source: input.source,
      data,
      summary: {
        itemCount: data.length,
        labels: data.flatMap((schema) => {
          const type = schema['@type'];
          if (Array.isArray(type)) {
            return type.map(String);
          }

          return type == null ? [] : [String(type)];
        }),
      },
    };
  }
}

function normalizeJsonLd(items: unknown[]): JsonLdSchema[] {
  const result: JsonLdSchema[] = [];

  for (const item of items) {
    if (Array.isArray(item)) {
      result.push(...normalizeJsonLd(item));
      continue;
    }

    if (!item || typeof item !== 'object') {
      continue;
    }

    const schema = item as JsonLdSchema;
    const graph = schema['@graph'];
    if (Array.isArray(graph)) {
      result.push(...normalizeJsonLd(graph));
      continue;
    }

    const type = schema['@type'];
    if (Array.isArray(type)) {
      for (const currentType of type) {
        result.push({
          ...schema,
          '@type': currentType,
        });
      }
      continue;
    }

    result.push(schema);
  }

  return result;
}
