import type { FetchResult } from '@seo-solver/types/fetch';
import type { Page, Response } from 'playwright';
import { detectResourceType } from './detect-resource-type';

export async function pageToFetchResult(
  page: Page,
  response: Response,
  requestUrl: string,
  redirects: [status: number, url: string][],
  timing: number,
  attempts: number,
): Promise<FetchResult> {
  const url = page.url();
  const headers = normalizeHeaders(response.headers());
  const contentType = headers['content-type'] ?? null;
  const resourceType = detectResourceType(url, contentType);
  const body = resourceType === 'html' ? await page.content() : await response.text();

  return {
    attempts,
    body,
    headers,
    redirects,
    requestUrl,
    resourceType,
    statusCode: response.status(),
    timing,
    url,
  };
}

function normalizeHeaders(headers: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]));
}
