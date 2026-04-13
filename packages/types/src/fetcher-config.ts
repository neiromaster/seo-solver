import type { RetryOptions } from './retry';

export type FetcherConfig = {
  timeout?: number;
  userAgent?: string;
  headers?: Record<string, string>;
  maxRedirects?: number;
  retry?: RetryOptions;
};
