import type { Browser } from 'playwright';
import type { PlaywrightBrowserClient } from './playwright-browser-client';
import type { PlaywrightPageReader } from './playwright-page-reader';

export type BrowserHtmlSnapshot = {
  finalUrl: string;
  html: string;
};

export type BrowserHtmlClient = {
  get(url: string): Promise<BrowserHtmlSnapshot>;
};

export type BrowserHtmlClientDeps = {
  browserClient: PlaywrightBrowserClient;
  pageReader: PlaywrightPageReader;
  launchBrowser: (launch: () => Promise<Browser>) => Promise<Browser>;
};

export function createBrowserHtmlClient(deps: BrowserHtmlClientDeps): BrowserHtmlClient {
  return {
    async get(url) {
      let browser: Browser | undefined;

      try {
        browser = await deps.launchBrowser(() => deps.browserClient.launch());
        return await deps.pageReader.readHtml(browser, url);
      } finally {
        if (browser) {
          await browser.close();
        }
      }
    },
  };
}
