import type { Fetcher, FetcherConfig, FetchOptions, FetchResult } from '@seo-solver/types/fetch';
import { detectResourceType } from '../core/detect-resource-type.js';
import { FetchError } from '../core/errors.js';
import { mergeOptions, type ResolvedFetchOptions } from '../core/merge-options.js';
import { withRetry } from '../core/retry.js';

const REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308]);

export class NativeFetcher implements Fetcher {
  readonly name = 'native';

  constructor(private readonly config: FetcherConfig = {}) {}

  async fetch(url: string, options?: FetchOptions): Promise<FetchResult> {
    const requestUrl = parseRequestUrl(url);
    const resolvedOptions = mergeOptions(this.config, options);
    const startedAt = Date.now();

    const { attempts, result } = await withRetry(
      () => this.fetchOnce(requestUrl, resolvedOptions),
      (error, value) => shouldRetry(error, value, resolvedOptions),
      resolvedOptions.retry,
      resolvedOptions.signal,
    );

    return {
      ...result,
      attempts,
      timing: Date.now() - startedAt,
    };
  }

  async dispose(): Promise<void> {}

  private async fetchOnce(requestUrl: string, options: ResolvedFetchOptions): Promise<FetchResult> {
    const redirects: [status: number, url: string][] = [];
    let currentUrl = requestUrl;

    for (let redirectCount = 0; redirectCount <= options.maxRedirects; redirectCount += 1) {
      // biome-ignore lint/performance/noAwaitInLoops: redirect chain must be sequential
      const response = await this.request(currentUrl, options);
      if (REDIRECT_STATUS_CODES.has(response.status) && redirectCount === options.maxRedirects) {
        throw new FetchError(`Too many redirects while fetching ${requestUrl}`, requestUrl, 'TOO_MANY_REDIRECTS');
      }

      const location = response.headers.get('location');
      if (REDIRECT_STATUS_CODES.has(response.status) && location) {
        redirects.push([response.status, currentUrl]);
        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }

      const headers = normalizeHeaders(response.headers);
      const body = await readResponseText(response, headers['content-type']);

      return {
        attempts: 1,
        body,
        headers,
        redirects,
        requestUrl,
        resourceType: detectResourceType(currentUrl, headers['content-type'] ?? null),
        statusCode: response.status,
        timing: 0,
        url: currentUrl,
      };
    }

    throw new FetchError(`Too many redirects while fetching ${requestUrl}`, requestUrl, 'TOO_MANY_REDIRECTS');
  }

  private async request(url: string, options: ResolvedFetchOptions): Promise<Response> {
    const timeoutSignal = AbortSignal.timeout(options.timeout);
    const signal = options.signal ? AbortSignal.any([options.signal, timeoutSignal]) : timeoutSignal;

    try {
      return await fetch(url, {
        headers: options.headers,
        redirect: 'manual',
        signal,
      });
    } catch (error) {
      throw normalizeFetchError(error, url, options.signal, timeoutSignal, signal);
    }
  }
}

const defaultFetcher = new NativeFetcher();

export function createFetcher(config?: FetcherConfig): Fetcher {
  return new NativeFetcher(config);
}

export function fetchUrl(url: string, options?: FetchOptions): Promise<FetchResult> {
  return defaultFetcher.fetch(url, options);
}

function parseRequestUrl(url: string): string {
  try {
    return new URL(url).toString();
  } catch (error) {
    throw new FetchError(`Invalid URL: ${url}`, url, 'INVALID_URL', { cause: error });
  }
}

function shouldRetry(error: unknown, result: FetchResult | undefined, options: ResolvedFetchOptions): boolean {
  if (result) {
    return options.retry.retryOn.includes(result.statusCode);
  }

  if (!(error instanceof FetchError)) {
    return false;
  }

  return error.code === 'NETWORK' || error.code === 'TIMEOUT';
}

function normalizeHeaders(headers: Headers): Record<string, string> {
  const normalized: Record<string, string> = {};
  headers.forEach((value, key) => {
    normalized[key.toLowerCase()] = value;
  });

  return normalized;
}

async function readResponseText(response: Response, contentType?: string): Promise<string> {
  const buffer = Buffer.from(await response.arrayBuffer());
  const charset = parseCharset(contentType);
  try {
    return new TextDecoder(charset).decode(buffer);
  } catch {
    return new TextDecoder().decode(buffer);
  }
}

function parseCharset(contentType?: string): string {
  const match = contentType?.match(/charset=([^;]+)/i);
  return match?.[1]?.trim().toLowerCase() ?? 'utf-8';
}

function normalizeFetchError(
  error: unknown,
  url: string,
  externalSignal: AbortSignal | undefined,
  timeoutSignal: AbortSignal,
  combinedSignal: AbortSignal,
): FetchError {
  if (error instanceof FetchError) {
    return error;
  }

  if (externalSignal?.aborted) {
    return new FetchError(`Request aborted for ${url}`, url, 'ABORTED', { cause: externalSignal.reason });
  }

  if (
    timeoutSignal.aborted ||
    getReasonName(combinedSignal.reason) === 'TimeoutError' ||
    hasErrorName(error, 'TimeoutError')
  ) {
    return new FetchError(`Request timed out for ${url}`, url, 'TIMEOUT', { cause: error });
  }

  if (hasErrorName(error, 'AbortError')) {
    return new FetchError(`Request aborted for ${url}`, url, 'ABORTED', { cause: error });
  }

  return new FetchError(`Network error while fetching ${url}`, url, 'NETWORK', { cause: error });
}

function hasErrorName(error: unknown, name: string): boolean {
  return error instanceof Error && error.name === name;
}

function getReasonName(reason: unknown): string | undefined {
  if (reason instanceof Error) {
    return reason.name;
  }

  return undefined;
}
