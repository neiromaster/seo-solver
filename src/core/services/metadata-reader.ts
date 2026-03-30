import type { Browser } from 'playwright';
import { chromium } from 'playwright';
import { fetchHtmlBasic as fetchHtmlBasicDefault } from '#core/fetchers/basic.fetcher';
import { fetchHtmlCurl as fetchHtmlCurlDefault } from '#core/fetchers/curl.fetcher';
import {
  extractOgBrowser as extractOgBrowserDefault,
  extractSchemasBrowser as extractSchemasBrowserDefault,
} from '#core/fetchers/playwright.fetcher';
import {
  extractOgFromHtml as extractOgFromHtmlDefault,
  extractSchemasFromHtml as extractSchemasFromHtmlDefault,
} from '#core/parsers';
import type { FetcherConfig } from '#core/services/fetcher-config';
import type { OgData, Schema } from '#types';
import { launchDefaultBrowserWithRuntimePrompt } from './playwright-runtime';

export type MetadataReader = {
  readOg(url: string, fetcher: FetcherConfig): Promise<OgData>;
  readSchemas(url: string, fetcher: FetcherConfig): Promise<Schema[]>;
};

export type MetadataReaderDeps = {
  fetchHtmlBasic: (url: string) => string | Promise<string>;
  fetchHtmlCurl: (url: string) => string | Promise<string>;
  launchBrowser: () => Promise<Browser>;
  connectBrowser: (target: string) => Promise<Browser>;
  extractOgBrowser: (browser: Browser, url: string) => Promise<OgData>;
  extractSchemasBrowser: (browser: Browser, url: string) => Promise<Schema[]>;
  extractOgFromHtml: (html: string, url: string) => OgData;
  extractSchemasFromHtml: (html: string, url: string) => Schema[];
};

export function launchDefaultMetadataBrowser(): Promise<Browser> {
  return launchDefaultBrowserWithRuntimePrompt(() => chromium.launch());
}

const defaultMetadataReaderDeps: MetadataReaderDeps = {
  fetchHtmlBasic: fetchHtmlBasicDefault,
  fetchHtmlCurl: fetchHtmlCurlDefault,
  launchBrowser: launchDefaultMetadataBrowser,
  connectBrowser: connectDefaultMetadataBrowser,
  extractOgBrowser: extractOgBrowserDefault,
  extractSchemasBrowser: extractSchemasBrowserDefault,
  extractOgFromHtml: extractOgFromHtmlDefault,
  extractSchemasFromHtml: extractSchemasFromHtmlDefault,
};

export function connectDefaultMetadataBrowser(target: string): Promise<Browser> {
  return chromium.connectOverCDP(toChromeEndpointUrl(target));
}

export function createMetadataReader(deps: MetadataReaderDeps = defaultMetadataReaderDeps): MetadataReader {
  return {
    async readOg(url, fetcher) {
      if (fetcher.type === 'basic') {
        const html = await deps.fetchHtmlBasic(url);
        return deps.extractOgFromHtml(html, url);
      }

      if (fetcher.type === 'curl') {
        const html = await deps.fetchHtmlCurl(url);
        return deps.extractOgFromHtml(html, url);
      }

      const browser = await getBrowser(fetcher, deps);
      try {
        return await deps.extractOgBrowser(browser, url);
      } finally {
        await browser.close();
      }
    },

    async readSchemas(url, fetcher) {
      if (fetcher.type === 'basic') {
        const html = await deps.fetchHtmlBasic(url);
        return deps.extractSchemasFromHtml(html, url);
      }

      if (fetcher.type === 'curl') {
        const html = await deps.fetchHtmlCurl(url);
        return deps.extractSchemasFromHtml(html, url);
      }

      const browser = await getBrowser(fetcher, deps);
      try {
        return await deps.extractSchemasBrowser(browser, url);
      } finally {
        await browser.close();
      }
    },
  };
}

async function getBrowser(
  fetcher: Extract<FetcherConfig, { type: 'chrome' }>,
  deps: MetadataReaderDeps,
): Promise<Browser> {
  if (fetcher.mode === 'launch') {
    return deps.launchBrowser();
  }

  return deps.connectBrowser(fetcher.target);
}

function toChromeEndpointUrl(target: string): string {
  if (/^https?:\/\//.test(target)) {
    return target;
  }

  return `http://${target}`;
}
