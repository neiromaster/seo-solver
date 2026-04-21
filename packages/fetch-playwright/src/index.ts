export { isFetchErrorLike } from '@seo-solver/fetch';
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
export { detectResourceType } from './detect-resource-type.js';
export { FetchError } from './errors.js';

export type { PlaywrightFetcherConfig } from './playwright-fetcher.js';
export { createFetcher, fetchUrl, PlaywrightFetcher } from './playwright-fetcher.js';
