import type { Browser, Page } from 'playwright';

import { AppError, JsonParseError, NoDataFoundError, PlaywrightError } from '#core/errors';
import { normalizeSchemas } from '#core/parsers';

import type { OgData, Schema } from '#types';

const BROWSER_CONTEXT_OPTIONS = {
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  locale: 'ru-RU',
};

function addOgValue(og: OgData, prop: string, content: string): void {
  const current = og[prop];
  if (current === undefined) {
    og[prop] = content;
    return;
  }

  if (Array.isArray(current)) {
    current.push(content);
    return;
  }

  og[prop] = [current, content];
}

async function withBrowserContext<T>(browser: Browser, fn: (page: Page) => Promise<T>): Promise<T> {
  const ctx = await browser.newContext(BROWSER_CONTEXT_OPTIONS);
  try {
    const page = await ctx.newPage();
    return await fn(page);
  } finally {
    try {
      await ctx.close();
    } catch {}
  }
}

export async function extractOgBrowser(browser: Browser, url: string): Promise<OgData> {
  try {
    const entries = await withBrowserContext(browser, async (page) => {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      return page
        .locator('meta')
        .evaluateAll((metas) =>
          metas
            .map(
              (el) =>
                [el.getAttribute('property') || el.getAttribute('name'), el.getAttribute('content')] as [
                  string | null,
                  string | null,
                ],
            )
            .filter(
              (entry): entry is [string, string] =>
                entry[0] !== null &&
                entry[1] !== null &&
                (entry[0].startsWith('og:') || entry[0].startsWith('twitter:')),
            ),
        );
    });
    const result: OgData = {};
    for (const [prop, content] of entries) {
      addOgValue(result, prop, content);
    }
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
        .evaluateAll((els) => els.map((el) => el.textContent));

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
        .filter((value) => value !== null);

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
