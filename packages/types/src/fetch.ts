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

export type { FetchOptions } from './fetch-options.js';
export type { FetchResult } from './fetch-result.js';
export type { Fetcher } from './fetcher.js';
export type { FetcherConfig } from './fetcher-config.js';
export type { RetryOptions } from './retry.js';

export type FetchErrorLike = {
  message: string;
  code: FetchErrorCode;
  retryable: boolean;
  url?: string | undefined;
  backend?: string | undefined;
  installHint?: string | undefined;
};
