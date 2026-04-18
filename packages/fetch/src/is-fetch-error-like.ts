import type { FetchErrorLike } from '@seo-solver/types/fetch';

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
