import type { HttpClient } from '#adapters/http';
import { AppError, type FetchedSource, type Fetcher, type SourceRef } from '#kernel';

export class BasicFetcher implements Fetcher {
  readonly id = 'basic';

  constructor(private readonly httpClient: HttpClient) {}

  async fetch(source: SourceRef): Promise<FetchedSource> {
    try {
      const response = await this.httpClient.get(source.url);

      return {
        source,
        finalUrl: response.finalUrl,
        statusCode: response.statusCode,
        contentType: response.contentType,
        body: response.body,
        headers: response.headers,
        meta: {},
      };
    } catch (error) {
      throw new AppError(`Basic fetch failed for ${source.url}`, { cause: error });
    }
  }
}
