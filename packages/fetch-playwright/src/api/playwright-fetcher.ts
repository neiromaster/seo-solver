import type { Fetcher, FetcherConfig, FetchOptions, FetchResult } from '@seo-solver/types/fetch';
import type { Browser, BrowserContext, BrowserType, Page, Response, Route } from 'playwright';
import { DEFAULT_BLOCK_RESOURCE_TYPES } from '../core/defaults.js';
import { FetchError } from '../core/errors.js';
import { mergeOptions, type ResolvedFetchOptions } from '../core/merge-options.js';
import { pageToFetchResult } from '../core/page-to-fetch-result.js';
import { withRetry } from '../core/retry.js';

export type PlaywrightFetcherConfig = FetcherConfig & {
  blockResourceTypes?: string[];
  browser?: 'chromium' | 'firefox' | 'webkit';
  headless?: boolean;
  javaScriptEnabled?: boolean;
  viewport?: {
    height: number;
    width: number;
  };
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit';
};

const REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308]);

export class PlaywrightFetcher implements Fetcher {
  readonly name = 'playwright';

  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private contextPromise: Promise<BrowserContext> | null = null;
  private disposed = false;

  constructor(private readonly config: PlaywrightFetcherConfig = {}) {}

  async fetch(url: string, options?: FetchOptions): Promise<FetchResult> {
    if (this.disposed) {
      throw new FetchError('Playwright fetcher has been disposed', url, 'DISPOSED_FETCHER', undefined, {
        backend: 'playwright',
        retryable: false,
      });
    }

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

  async dispose(): Promise<void> {
    this.disposed = true;
    this.contextPromise = null;
    await this.context?.close();
    await this.browser?.close();
    this.context = null;
    this.browser = null;
  }

  private async fetchOnce(requestUrl: string, options: ResolvedFetchOptions): Promise<FetchResult> {
    const context = await this.ensureContext();
    const page = await context.newPage();
    const redirects: [status: number, url: string][] = [];

    const onResponse = (response: Response) => {
      if (response.frame() !== page.mainFrame() || !response.request().isNavigationRequest()) {
        return;
      }

      const status = response.status();
      if (REDIRECT_STATUS_CODES.has(status)) {
        redirects.push([status, response.url()]);
      }
    };

    page.on('response', onResponse);

    try {
      await page.setExtraHTTPHeaders(options.headers);
      const response = await navigateWithAbort(
        page,
        requestUrl,
        options.signal,
        this.config.waitUntil,
        options.timeout,
      );
      if (!response) {
        throw new FetchError(`No response returned for ${requestUrl}`, requestUrl, 'NETWORK');
      }

      if (redirects.length > options.maxRedirects) {
        throw new FetchError(`Too many redirects while fetching ${requestUrl}`, requestUrl, 'TOO_MANY_REDIRECTS');
      }

      return await pageToFetchResult(page, response, requestUrl, redirects, 0, 1);
    } catch (error) {
      throw normalizePlaywrightError(error, requestUrl, options.signal);
    } finally {
      page.off('response', onResponse);
      await page.close();
    }
  }

  private async ensureContext(): Promise<BrowserContext> {
    if (this.disposed) {
      throw new FetchError('Playwright fetcher has been disposed', undefined, 'DISPOSED_FETCHER', undefined, {
        backend: 'playwright',
        retryable: false,
      });
    }

    if (this.context) {
      return this.context;
    }

    if (this.contextPromise) {
      return this.contextPromise;
    }

    this.contextPromise = this.createContext();
    this.context = await this.contextPromise;
    this.contextPromise = null;
    return this.context;
  }

  private async createContext(): Promise<BrowserContext> {
    const playwrightModule = await import('playwright');
    const browserType: 'chromium' | 'firefox' | 'webkit' = this.config.browser ?? 'chromium';
    const playwright = playwrightModule as Record<'chromium' | 'firefox' | 'webkit', BrowserType>;
    const browser = await playwright[browserType].launch({
      headless: this.config.headless ?? true,
    });
    this.browser = browser;

    const context = await browser.newContext({
      ...(this.config.headers === undefined ? {} : { extraHTTPHeaders: this.config.headers }),
      javaScriptEnabled: this.config.javaScriptEnabled ?? true,
      serviceWorkers: 'block',
      ...(this.config.userAgent === undefined ? {} : { userAgent: this.config.userAgent }),
      viewport: this.config.viewport ?? { height: 720, width: 1280 },
    });

    const blockedTypes = new Set(this.config.blockResourceTypes ?? DEFAULT_BLOCK_RESOURCE_TYPES);
    await context.route('**/*', async (route: Route) => {
      const resourceType = route.request().resourceType();
      if (blockedTypes.has(resourceType)) {
        await route.abort();
        return;
      }

      await route.continue();
    });

    return context;
  }
}

export function createFetcher(config?: PlaywrightFetcherConfig): Fetcher {
  return new PlaywrightFetcher(config);
}

export async function fetchUrl(url: string, options?: FetchOptions): Promise<FetchResult> {
  const fetcher = createFetcher(options);

  try {
    return await fetcher.fetch(url, options);
  } finally {
    await fetcher.dispose();
  }
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

async function navigateWithAbort(
  page: Page,
  url: string,
  signal: AbortSignal | undefined,
  waitUntil: PlaywrightFetcherConfig['waitUntil'] | undefined,
  timeout: number,
): Promise<Response | null> {
  if (signal?.aborted) {
    throw new FetchError(`Request aborted for ${url}`, url, 'ABORTED', { cause: signal.reason });
  }

  const navigationPromise = page.goto(url, {
    timeout,
    waitUntil: waitUntil ?? 'domcontentloaded',
  });

  if (!signal) {
    return navigationPromise;
  }

  return await new Promise<Response | null>((resolve, reject) => {
    const onAbort = () => {
      cleanup();
      void page.close().catch(() => undefined);
      reject(new FetchError(`Request aborted for ${url}`, url, 'ABORTED', { cause: signal.reason }));
    };

    const cleanup = () => {
      signal.removeEventListener('abort', onAbort);
    };

    signal.addEventListener('abort', onAbort, { once: true });

    navigationPromise.then(
      (response) => {
        cleanup();
        resolve(response);
      },
      (error) => {
        cleanup();
        reject(error);
      },
    );
  });
}

function normalizePlaywrightError(error: unknown, url: string, externalSignal?: AbortSignal): FetchError {
  if (error instanceof FetchError) {
    return error;
  }

  if (externalSignal?.aborted) {
    return new FetchError(`Request aborted for ${url}`, url, 'ABORTED', { cause: externalSignal.reason });
  }

  if (error instanceof Error && (error.name === 'TimeoutError' || /timeout/i.test(error.message))) {
    return new FetchError(`Request timed out for ${url}`, url, 'TIMEOUT', { cause: error });
  }

  if (error instanceof Error && /aborted|cancelled/i.test(error.message)) {
    return new FetchError(`Request aborted for ${url}`, url, 'ABORTED', { cause: error });
  }

  return new FetchError(`Network error while fetching ${url}`, url, 'NETWORK', { cause: error });
}
