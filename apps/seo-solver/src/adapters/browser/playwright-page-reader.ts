import type { Browser, Page } from 'playwright';

const BROWSER_CONTEXT_OPTIONS = {
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  locale: 'ru-RU',
};

export type BrowserPageSnapshot = {
  finalUrl: string;
  html: string;
};

export type PlaywrightPageReader = {
  readHtml(browser: Browser, url: string): Promise<BrowserPageSnapshot>;
};

export function createPlaywrightPageReader(): PlaywrightPageReader {
  return {
    async readHtml(browser, url) {
      return withBrowserContext(browser, async (page) => {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

        return {
          finalUrl: page.url(),
          html: await page.content(),
        };
      });
    },
  };
}

async function withBrowserContext<T>(browser: Browser, callback: (page: Page) => Promise<T>): Promise<T> {
  const context = await browser.newContext(BROWSER_CONTEXT_OPTIONS);

  try {
    const page = await context.newPage();
    return await callback(page);
  } finally {
    try {
      await context.close();
    } catch {}
  }
}
