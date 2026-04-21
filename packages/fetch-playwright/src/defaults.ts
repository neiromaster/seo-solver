export const DEFAULT_TIMEOUT = 30_000;
export const DEFAULT_MAX_REDIRECTS = 5;
export const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0';
export const DEFAULT_RETRY = {
  attempts: 1,
  delay: 1000,
  backoff: 'fixed',
  retryOn: [429, 500, 502, 503, 504],
  respectRetryAfter: true,
};
export const DEFAULT_HEADERS: Record<string, string> = {
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'accept-encoding': 'gzip, deflate, br',
  'accept-language': 'en-US,en;q=0.5',
};
export const DEFAULT_BLOCK_RESOURCE_TYPES = ['image', 'font', 'media', 'stylesheet'];
