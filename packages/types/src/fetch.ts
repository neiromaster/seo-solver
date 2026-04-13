export type FetchErrorCode =
  | 'TIMEOUT'
  | 'ABORTED'
  | 'NETWORK'
  | 'NETWORK_ERROR'
  | 'TOO_MANY_REDIRECTS'
  | 'INVALID_URL'
  | 'DISPOSED_FETCHER'
  | 'MISSING_OPTIONAL_BACKEND'
  | 'MISSING_RUNTIME_DEPENDENCY'
  | 'MISSING_BROWSER_BINARY'
  | 'DUPLICATE_BACKEND'
  | 'UNKNOWN_BACKEND';

export type { FetchOptions } from './fetch-options';
export type { FetchResult } from './fetch-result';
export type { Fetcher } from './fetcher';
export type { FetcherConfig } from './fetcher-config';
export type { RetryOptions } from './retry';

export type FetchErrorLike = {
  message: string;
  code: FetchErrorCode;
  retryable: boolean;
  url?: string;
  backend?: string;
  installHint?: string;
};

export function isFetchErrorLike(value: unknown): value is FetchErrorLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof value.message === 'string' &&
    'code' in value &&
    typeof value.code === 'string' &&
    'retryable' in value &&
    typeof value.retryable === 'boolean' &&
    (!('url' in value) || value.url === undefined || typeof value.url === 'string') &&
    (!('backend' in value) || value.backend === undefined || typeof value.backend === 'string') &&
    (!('installHint' in value) || value.installHint === undefined || typeof value.installHint === 'string')
  );
}
