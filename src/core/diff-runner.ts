import { bold, cyan } from 'ansis';
import type { Browser } from 'playwright';
import { chromium } from 'playwright';
import type { OgData, Schema } from '#types';
import { compareJsonLd, compareOg } from './comparers';
import { fetchHtmlCurl } from './fetchers/curl.fetcher';
import { extractOgBrowser, extractSchemasBrowser } from './fetchers/playwright.fetcher';
import { formatSchemasForDiff, openVscodeDiff } from './formatters';
import { extractOgFromHtml, extractSchemasFromHtml } from './parsers';

export type DiffOptions = {
  useCurl: boolean;
  useOg: boolean;
  vscodeDiff: boolean;
};

export type DiffRunnerDeps = {
  fetchHtmlCurl: typeof fetchHtmlCurl;
  extractOgBrowser: typeof extractOgBrowser;
  extractSchemasBrowser: typeof extractSchemasBrowser;
  extractOgFromHtml: typeof extractOgFromHtml;
  extractSchemasFromHtml: typeof extractSchemasFromHtml;
  compareOg: typeof compareOg;
  compareJsonLd: typeof compareJsonLd;
  formatSchemasForDiff: typeof formatSchemasForDiff;
  openVscodeDiff: typeof openVscodeDiff;
  launchBrowser: () => Promise<Browser>;
};

export function launchDefaultDiffBrowser(): Promise<Browser> {
  return chromium.launch();
}

const defaultDiffRunnerDeps: DiffRunnerDeps = {
  fetchHtmlCurl,
  extractOgBrowser,
  extractSchemasBrowser,
  extractOgFromHtml,
  extractSchemasFromHtml,
  compareOg,
  compareJsonLd,
  formatSchemasForDiff,
  openVscodeDiff,
  launchBrowser: launchDefaultDiffBrowser,
};

export async function runDiff(
  url1: string,
  url2: string,
  options: DiffOptions,
  deps: DiffRunnerDeps = defaultDiffRunnerDeps,
): Promise<void> {
  const { useCurl, useOg, vscodeDiff } = options;
  const mode = useOg ? 'OpenGraph' : 'JSON-LD';
  console.log(`\n${bold(`Fetching ${mode} metadata${useCurl ? ' (curl/SSR)' : ' (browser)'}...`)}`);

  let d1: OgData | Schema[], d2: OgData | Schema[];

  if (useCurl) {
    const [html1, html2] = await Promise.all([deps.fetchHtmlCurl(url1), deps.fetchHtmlCurl(url2)]);
    d1 = useOg ? deps.extractOgFromHtml(html1, url1) : deps.extractSchemasFromHtml(html1, url1);
    d2 = useOg ? deps.extractOgFromHtml(html2, url2) : deps.extractSchemasFromHtml(html2, url2);
  } else {
    const browser = await deps.launchBrowser();
    try {
      if (useOg) {
        [d1, d2] = await Promise.all([deps.extractOgBrowser(browser, url1), deps.extractOgBrowser(browser, url2)]);
      } else {
        [d1, d2] = await Promise.all([
          deps.extractSchemasBrowser(browser, url1),
          deps.extractSchemasBrowser(browser, url2),
        ]);
      }
    } finally {
      await browser.close();
    }
  }

  const countLabel = useOg ? `${Object.keys(d1).length} tag(s)` : `${(d1 as Schema[]).length} schema(s)`;
  const countLabel2 = useOg ? `${Object.keys(d2).length} tag(s)` : `${(d2 as Schema[]).length} schema(s)`;
  console.log(`${cyan`URL1:`} ${url1} → ${countLabel}`);
  console.log(`${cyan`URL2:`} ${url2} → ${countLabel2}\n`);

  if (useOg) {
    deps.compareOg(d1 as OgData, d2 as OgData);
  } else {
    deps.compareJsonLd(d1 as Schema[], d2 as Schema[]);
  }

  if (vscodeDiff) {
    const prefix = useOg ? 'og' : 'schema';
    const content1 = useOg ? JSON.stringify(d1, null, 2) : deps.formatSchemasForDiff(d1 as Schema[]);
    const content2 = useOg ? JSON.stringify(d2, null, 2) : deps.formatSchemasForDiff(d2 as Schema[]);
    deps.openVscodeDiff(content1, content2, prefix, url1, url2);
  }
}
