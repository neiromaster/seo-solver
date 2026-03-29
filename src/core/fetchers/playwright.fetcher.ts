import type { Browser } from 'playwright';

import { AppError, JsonParseError, NoDataFoundError, PlaywrightError } from '#core/errors';
import { normalizeSchemas } from '#core/parsers';

import type { OgData, Schema } from '#types';

const BROWSER_CONTEXT_OPTIONS = {
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  locale: 'ru-RU',
};

async function withBrowserContext<T>(
  browser: Browser,
  fn: (page: import('playwright').Page) => Promise<T>,
): Promise<T> {
  const ctx = await browser.newContext(BROWSER_CONTEXT_OPTIONS);
  const page = await ctx.newPage();
  try {
    return await fn(page);
  } finally {
    await ctx.close();
  }
}

export async function extractOgBrowser(browser: Browser, url: string): Promise<OgData> {
  try {
    const result = await withBrowserContext(browser, async (page) => {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      return page
        .locator('meta')
        .evaluateAll((metas) =>
          Object.fromEntries(
            (metas as Element[])
              .map(
                (el) =>
                  [el.getAttribute('property') || el.getAttribute('name'), el.getAttribute('content')] as [
                    string | null,
                    string | null,
                  ],
              )
              .filter(
                ([prop, content]) =>
                  prop && content !== null && (prop.startsWith('og:') || prop.startsWith('twitter:')),
              ),
          ),
        );
    });
    if (Object.keys(result).length === 0) {
      throw new NoDataFoundError(url, 'opengraph');
    }
    return result;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new PlaywrightError(url, error);
  }
}

export async function extractSchemasBrowser(browser: Browser, url: string): Promise<Schema[]> {
  try {
    return await withBrowserContext(browser, async (page) => {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      const texts = await page
        .locator('script[type="application/ld+json"]')
        .evaluateAll((els) => (els as Element[]).map((el) => el.textContent));

      const nonNull = texts.filter((t): t is string => t !== null);
      if (nonNull.length === 0) {
        throw new NoDataFoundError(url, 'schemas');
      }

      let lastError: unknown;
      const parsed = nonNull
        .map((t) => {
          try {
            return JSON.parse(t) as unknown;
          } catch (e) {
            lastError = e;
            return null;
          }
        })
        .filter(Boolean);

      if (parsed.length === 0) {
        throw new JsonParseError(url, lastError);
      }

      return normalizeSchemas(parsed);
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new PlaywrightError(url, error);
  }
}
