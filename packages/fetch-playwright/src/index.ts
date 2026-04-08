export type {
  Fetcher,
  FetcherConfig,
  FetchOptions,
  FetchResult,
  ResourceType,
  RetryOptions,
} from '@seo-solver/types';
export { detectResourceType } from './detect-resource-type.js';
export { FetchError, type FetchErrorCode } from './errors.js';
export { pageToFetchResult } from './page-to-fetch-result.js';

export type { PlaywrightFetcherConfig } from './playwright-fetcher.js';
export { createFetcher, PlaywrightFetcher } from './playwright-fetcher.js';
