import type { FetchedSource, Fetcher, SourceRef } from '#kernel';

export class FakeFetcher implements Fetcher {
  readonly id: string;

  constructor(
    private readonly bodyByUrl: Record<string, string>,
    id = 'fake-fetcher',
  ) {
    this.id = id;
  }

  async fetch(source: SourceRef): Promise<FetchedSource> {
    return {
      source,
      finalUrl: source.url,
      body: this.bodyByUrl[source.url] ?? '',
      headers: {},
      meta: {},
    };
  }
}
