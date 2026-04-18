import type { RetryOptions } from './retry.js';

export type FetcherConfig = {
  timeout?: number | undefined;
  userAgent?: string | undefined;
  headers?: Record<string, string> | undefined;
  maxRedirects?: number | undefined;
  retry?: RetryOptions | undefined;
};
