import type { Browser } from 'playwright';
import { chromium } from 'playwright';
import { fetchHtmlCurl as fetchHtmlCurlDefault } from '#core/fetchers/curl.fetcher';
import {
  extractOgBrowser as extractOgBrowserDefault,
  extractSchemasBrowser as extractSchemasBrowserDefault,
} from '#core/fetchers/playwright.fetcher';
import {
  extractOgFromHtml as extractOgFromHtmlDefault,
  extractSchemasFromHtml as extractSchemasFromHtmlDefault,
} from '#core/parsers';
import type { OgData, Schema } from '#types';
import { launchDefaultBrowserWithRuntimePrompt } from './playwright-runtime';

export type ReadMode = 'curl' | 'browser';

export type MetadataReader = {
  readOg(url: string, mode: ReadMode): Promise<OgData>;
  readSchemas(url: string, mode: ReadMode): Promise<Schema[]>;
};

export type MetadataReaderDeps = {
  fetchHtmlCurl: (url: string) => string | Promise<string>;
  launchBrowser: () => Promise<Browser>;
  extractOgBrowser: (browser: Browser, url: string) => Promise<OgData>;
  extractSchemasBrowser: (browser: Browser, url: string) => Promise<Schema[]>;
  extractOgFromHtml: (html: string, url: string) => OgData;
  extractSchemasFromHtml: (html: string, url: string) => Schema[];
};

export function launchDefaultMetadataBrowser(): Promise<Browser> {
  return launchDefaultBrowserWithRuntimePrompt(() => chromium.launch());
}

const defaultMetadataReaderDeps: MetadataReaderDeps = {
  fetchHtmlCurl: fetchHtmlCurlDefault,
  launchBrowser: launchDefaultMetadataBrowser,
  extractOgBrowser: extractOgBrowserDefault,
  extractSchemasBrowser: extractSchemasBrowserDefault,
  extractOgFromHtml: extractOgFromHtmlDefault,
  extractSchemasFromHtml: extractSchemasFromHtmlDefault,
};

export function createMetadataReader(deps: MetadataReaderDeps = defaultMetadataReaderDeps): MetadataReader {
  return {
    async readOg(url, mode) {
      if (mode === 'curl') {
        const html = await deps.fetchHtmlCurl(url);
        return deps.extractOgFromHtml(html, url);
      }

      const browser = await deps.launchBrowser();
      try {
        return await deps.extractOgBrowser(browser, url);
      } finally {
        await browser.close();
      }
    },

    async readSchemas(url, mode) {
      if (mode === 'curl') {
        const html = await deps.fetchHtmlCurl(url);
        return deps.extractSchemasFromHtml(html, url);
      }

      const browser = await deps.launchBrowser();
      try {
        return await deps.extractSchemasBrowser(browser, url);
      } finally {
        await browser.close();
      }
    },
  };
}
