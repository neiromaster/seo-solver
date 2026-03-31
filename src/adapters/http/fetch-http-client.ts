export type HttpResponse = {
  finalUrl: string;
  statusCode: number;
  contentType?: string;
  body: string;
  headers: Record<string, string>;
};

export type HttpClient = {
  get(url: string): Promise<HttpResponse>;
};

const DEFAULT_HEADERS = {
  'Accept-Language': 'ru-RU,ru;q=0.9',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
} as const;

export function createFetchHttpClient(fetchImpl: typeof fetch = fetch): HttpClient {
  return {
    async get(url) {
      const response = await fetchImpl(url, {
        headers: DEFAULT_HEADERS,
        redirect: 'follow',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`.trim());
      }

      return {
        finalUrl: response.url,
        statusCode: response.status,
        contentType: response.headers.get('content-type') ?? undefined,
        body: await response.text(),
        headers: Object.fromEntries(response.headers.entries()),
      };
    },
  };
}
