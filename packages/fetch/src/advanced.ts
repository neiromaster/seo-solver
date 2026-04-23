import type { FetcherConfig, FetchOptions, FetchResult, RetryOptions } from '@seo-solver/types/fetch';
import { registerBackend, resolveBackend } from './advanced-runtime/backend-registry.js';
import { createFetcher } from './api/native-fetcher.js';
import { withRetry } from './core/retry.js';

type SharedRetryResult = {
  headers?: Record<string, string>;
  statusCode?: number;
};

let nativeRegistered = false;

export function registerNativeBackend(): void {
  if (nativeRegistered) {
    return;
  }

  registerBackend('native', async () => ({
    createFetcher: (config?: unknown) => createFetcher(config as FetcherConfig | undefined),
  }));
  nativeRegistered = true;
}

export { registerBackend, resolveBackend };

export function createSharedRetryExecutor() {
  return async function runWithSharedRetry<T extends SharedRetryResult>(
    operation: () => Promise<T>,
    shouldRetry: (error: unknown, value: T | undefined) => boolean,
    options?: RetryOptions,
    signal?: AbortSignal,
  ): Promise<{ attempts: number; result: T }> {
    return await withRetry(
      operation,
      shouldRetry,
      {
        attempts: options?.attempts ?? 1,
        backoff: options?.backoff ?? 'fixed',
        delay: options?.delay ?? 0,
        respectRetryAfter: options?.respectRetryAfter ?? true,
      },
      signal,
    );
  };
}

export type { FetcherConfig, FetchOptions, FetchResult, RetryOptions };
