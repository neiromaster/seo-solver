import type { RetryOptions } from '@seo-solver/types';

export const DEFAULT_TIMEOUT = 30_000;
export const DEFAULT_MAX_REDIRECTS = 5;
export const DEFAULT_USER_AGENT = 'seo-solver/0.1 (compatible; bot)';
export const DEFAULT_RETRY: Required<RetryOptions> = {
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
