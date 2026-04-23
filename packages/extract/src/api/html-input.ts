import type { FetchResult } from '@seo-solver/types/fetch';

export function htmlToMinimalFetchResult(
  body: string,
  resourceType: FetchResult['resourceType'],
  url = 'about:blank',
  statusCode = 200,
): FetchResult {
  return {
    requestUrl: url,
    url,
    statusCode,
    headers: {},
    body,
    resourceType,
    redirects: [],
    timing: 0,
    attempts: 1,
  };
}
