import type { BrowserHtmlClient } from '#adapters/browser';
import { AppError, type FetchedSource, type Fetcher, type SourceRef } from '#kernel';

export type BrowserFetcherDeps = {
  browserHtmlClient: BrowserHtmlClient;
};

export class BrowserFetcher implements Fetcher {
  readonly id = 'browser';

  constructor(private readonly deps: BrowserFetcherDeps) {}

  async fetch(source: SourceRef): Promise<FetchedSource> {
    try {
      const snapshot = await this.deps.browserHtmlClient.get(source.url);

      return {
        source,
        finalUrl: snapshot.finalUrl,
        contentType: 'text/html',
        body: snapshot.html,
        headers: {},
        meta: {},
      };
    } catch (error) {
      throw new AppError(`Browser fetch failed for ${source.url}`, { cause: error });
    }
  }
}
