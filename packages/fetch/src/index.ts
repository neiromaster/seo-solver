export type { ResourceType } from '@seo-solver/types';
export type {
  FetchErrorCode,
  FetchErrorLike,
  Fetcher,
  FetcherConfig,
  FetchOptions,
  FetchResult,
  RetryOptions,
} from '@seo-solver/types/fetch';
export { createFetcher, fetchUrl } from './api/native-fetcher.js';
export { detectResourceType } from './core/detect-resource-type.js';
export { FetchError } from './core/errors.js';
export { isFetchErrorLike } from './core/is-fetch-error-like.js';
