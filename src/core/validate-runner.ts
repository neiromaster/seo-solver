import { bold, cyan, yellow } from 'ansis';
import { chromium } from 'playwright';
import type { OgData, Schema } from '#types';
import { fetchHtmlCurl } from './fetchers/curl.fetcher';
import { extractOgBrowser, extractSchemasBrowser } from './fetchers/playwright.fetcher';
import { extractOgFromHtml, extractSchemasFromHtml } from './parsers';
import { validateSchemas } from './validators/schema-org.validator';

export type ValidateOptions = {
  useCurl: boolean;
  useOg: boolean;
};

export async function runValidate(url: string, options: ValidateOptions): Promise<void> {
  const { useCurl, useOg } = options;
  const normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;

  const mode = useOg ? 'OpenGraph' : 'JSON-LD';
  console.log(`\n${bold(`Validating ${mode}${useCurl ? ' (curl/SSR)' : ' (browser)'}...`)}\n`);

  let data: OgData | Schema[];

  if (useCurl) {
    const html = fetchHtmlCurl(normalizedUrl);
    data = useOg ? extractOgFromHtml(html, normalizedUrl) : extractSchemasFromHtml(html, normalizedUrl);
  } else {
    const browser = await chromium.launch();
    try {
      if (useOg) {
        data = await extractOgBrowser(browser, normalizedUrl);
      } else {
        data = await extractSchemasBrowser(browser, normalizedUrl);
      }
    } finally {
      await browser.close();
    }
  }

  const countLabel = useOg ? `${Object.keys(data).length} tag(s)` : `${(data as Schema[]).length} schema(s)`;
  console.log(`${cyan`URL:`} ${normalizedUrl} → ${countLabel}\n`);

  if (!useOg) {
    await validateSchemas(data as Schema[]);
  } else {
    console.log(`${yellow`OpenGraph validation not supported`}\n`);
  }
}
