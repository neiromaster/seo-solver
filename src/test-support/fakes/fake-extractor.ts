import type { ExtractedDocument, Extractor, FetchedSource } from '#kernel';

export class FakeExtractor implements Extractor<string> {
  readonly id: string;
  readonly kind: string;

  constructor(kind = 'fake-document', id = 'fake-extractor') {
    this.kind = kind;
    this.id = id;
  }

  canExtract(_input: FetchedSource): boolean {
    return true;
  }

  async extract(input: FetchedSource): Promise<ExtractedDocument<string>> {
    return {
      extractorId: this.id,
      kind: this.kind,
      source: input.source,
      data: input.body,
      summary: { itemCount: input.body.length > 0 ? 1 : 0 },
    };
  }
}
