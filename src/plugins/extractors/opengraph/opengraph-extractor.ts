import { AppError, type ExtractedDocument, type Extractor, type FetchedSource } from '#kernel';

export type OpenGraphValue = string | string[];
export type OpenGraphDocument = Record<string, OpenGraphValue>;

export class OpenGraphExtractor implements Extractor<OpenGraphDocument> {
  readonly id = 'opengraph';
  readonly kind = 'opengraph';

  canExtract(input: FetchedSource): boolean {
    return /<(meta)\b/i.test(input.body);
  }

  async extract(input: FetchedSource): Promise<ExtractedDocument<OpenGraphDocument>> {
    const data: OpenGraphDocument = {};

    for (const match of input.body.matchAll(/<meta[^>]+>/gi)) {
      const tag = match[0];
      const property = tag.match(/(?:property|name)=["']([^"']+)["']/i)?.[1];
      const content = tag.match(/content=["']([^"']*)["']/i)?.[1];

      if (!property || content === undefined) {
        continue;
      }

      if (!(property.startsWith('og:') || property.startsWith('twitter:'))) {
        continue;
      }

      addValue(data, property, content);
    }

    if (Object.keys(data).length === 0) {
      throw new AppError(`No OpenGraph data found in ${input.source.url}`);
    }

    return {
      extractorId: this.id,
      kind: this.kind,
      source: input.source,
      data,
      summary: {
        itemCount: Object.keys(data).length,
        labels: Object.keys(data),
      },
    };
  }
}

function addValue(document: OpenGraphDocument, property: string, content: string): void {
  const current = document[property];

  if (current === undefined) {
    document[property] = content;
    return;
  }

  if (Array.isArray(current)) {
    current.push(content);
    return;
  }

  document[property] = [current, content];
}
