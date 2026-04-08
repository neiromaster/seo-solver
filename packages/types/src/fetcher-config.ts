import type { RetryOptions } from './retry.js';

export type FetcherConfig = {
  timeout?: number;
  userAgent?: string;
  headers?: Record<string, string>;
  maxRedirects?: number;
  retry?: RetryOptions;
};
