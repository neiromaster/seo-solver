import type { FetcherConfig, FetchOptions, RetryOptions } from '@seo-solver/types/fetch';
import {
  DEFAULT_HEADERS,
  DEFAULT_MAX_REDIRECTS,
  DEFAULT_RETRY,
  DEFAULT_TIMEOUT,
  DEFAULT_USER_AGENT,
} from './defaults.js';

export type ResolvedFetchOptions = {
  headers: Record<string, string>;
  maxRedirects: number;
  retry: {
    attempts: number;
    delay: number;
    backoff: 'fixed' | 'exponential';
    retryOn: number[];
    respectRetryAfter: boolean;
  };
  signal?: AbortSignal | undefined;
  timeout: number;
  userAgent: string;
};

export function mergeOptions(config: FetcherConfig = {}, perRequest?: FetchOptions): ResolvedFetchOptions {
  const configHeaders = normalizeHeaders(config.headers);
  const requestHeaders = normalizeHeaders(perRequest?.headers);

  const headers = {
    ...DEFAULT_HEADERS,
    ...configHeaders,
    ...requestHeaders,
  };

  const userAgent = config.userAgent ?? DEFAULT_USER_AGENT;
  if (!headers['user-agent']) {
    headers['user-agent'] = userAgent;
  }

  return {
    headers,
    maxRedirects: Math.max(0, config.maxRedirects ?? DEFAULT_MAX_REDIRECTS),
    retry: resolveRetryOptions(config.retry, perRequest?.retry),
    signal: perRequest?.signal,
    timeout: perRequest?.timeout ?? config.timeout ?? DEFAULT_TIMEOUT,
    userAgent,
  };
}

function resolveRetryOptions(configRetry?: RetryOptions, requestRetry?: RetryOptions): ResolvedFetchOptions['retry'] {
  return {
    attempts: Math.max(1, requestRetry?.attempts ?? configRetry?.attempts ?? DEFAULT_RETRY.attempts),
    delay: requestRetry?.delay ?? configRetry?.delay ?? DEFAULT_RETRY.delay,
    backoff: (requestRetry?.backoff ?? configRetry?.backoff ?? DEFAULT_RETRY.backoff) as 'fixed' | 'exponential',
    respectRetryAfter:
      requestRetry?.respectRetryAfter ?? configRetry?.respectRetryAfter ?? DEFAULT_RETRY.respectRetryAfter,
    retryOn: [...(requestRetry?.retryOn ?? configRetry?.retryOn ?? DEFAULT_RETRY.retryOn)],
  };
}

function normalizeHeaders(headers?: Record<string, string>): Record<string, string> {
  if (!headers) {
    return {};
  }

  return Object.fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]));
}
