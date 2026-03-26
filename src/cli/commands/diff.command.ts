import { chromium } from 'playwright';
import { compareJsonLd, compareOg } from '#core/comparers';
import { fetchHtmlCurl } from '#core/fetchers/curl.fetcher';
import { extractOgBrowser, extractSchemasBrowser } from '#core/fetchers/playwright.fetcher';
import { formatSchemasForDiff, openVscodeDiff } from '#core/formatters';
import { extractOgFromHtml, extractSchemasFromHtml } from '#core/parsers';
import { BOLD, CYAN, RESET } from '#lib';
import type { OgData, Schema } from '#types';

type DiffOptions = {
  useCurl: boolean;
  useOg: boolean;
  vscodeDiff: boolean;
};

export async function diffCommand(url1: string, url2: string, options: DiffOptions): Promise<void> {
  const { useCurl, useOg, vscodeDiff } = options;
  const mode = useOg ? 'OpenGraph' : 'JSON-LD';
  console.log(`\n${BOLD}Fetching ${mode} metadata${useCurl ? ' (curl/SSR)' : ' (browser)'}...${RESET}`);

  let d1: OgData | Schema[], d2: OgData | Schema[];

  if (useCurl) {
    const [html1, html2] = await Promise.all([fetchHtmlCurl(url1), fetchHtmlCurl(url2)]);
    d1 = useOg ? extractOgFromHtml(html1) : extractSchemasFromHtml(html1);
    d2 = useOg ? extractOgFromHtml(html2) : extractSchemasFromHtml(html2);
  } else {
    const browser = await chromium.launch();
    try {
      if (useOg) {
        [d1, d2] = await Promise.all([extractOgBrowser(browser, url1), extractOgBrowser(browser, url2)]);
      } else {
        [d1, d2] = await Promise.all([extractSchemasBrowser(browser, url1), extractSchemasBrowser(browser, url2)]);
      }
    } finally {
      await browser.close();
    }
  }

  const countLabel = useOg ? `${Object.keys(d1).length} tag(s)` : `${(d1 as Schema[]).length} schema(s)`;
  const countLabel2 = useOg ? `${Object.keys(d2).length} tag(s)` : `${(d2 as Schema[]).length} schema(s)`;
  console.log(`${CYAN}URL1:${RESET} ${url1} → ${countLabel}`);
  console.log(`${CYAN}URL2:${RESET} ${url2} → ${countLabel2}\n`);

  if (useOg) {
    compareOg(d1 as OgData, d2 as OgData);
  } else {
    compareJsonLd(d1 as Schema[], d2 as Schema[]);
  }

  if (vscodeDiff) {
    const prefix = useOg ? 'og' : 'schema';
    const content1 = useOg ? JSON.stringify(d1, null, 2) : formatSchemasForDiff(d1 as Schema[]);
    const content2 = useOg ? JSON.stringify(d2, null, 2) : formatSchemasForDiff(d2 as Schema[]);
    openVscodeDiff(content1, content2, prefix, url1, url2);
  }
}
