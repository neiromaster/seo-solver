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
export { createFetcher, fetchUrl, NativeFetcher } from './native-fetcher.js';
