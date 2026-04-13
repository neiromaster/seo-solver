import type { RetryOptions } from './retry';

export type FetchOptions = {
  timeout?: number;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  retry?: RetryOptions;
};
