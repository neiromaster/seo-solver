import { bold, cyan, yellow } from 'ansis';
import type { Browser } from 'playwright';
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

export type ValidateRunnerDeps = {
  fetchHtmlCurl: typeof fetchHtmlCurl;
  extractOgBrowser: typeof extractOgBrowser;
  extractSchemasBrowser: typeof extractSchemasBrowser;
  extractOgFromHtml: typeof extractOgFromHtml;
  extractSchemasFromHtml: typeof extractSchemasFromHtml;
  validateSchemas: typeof validateSchemas;
  launchBrowser: () => Promise<Browser>;
};

export function launchDefaultValidateBrowser(): Promise<Browser> {
  return chromium.launch();
}

const defaultValidateRunnerDeps: ValidateRunnerDeps = {
  fetchHtmlCurl,
  extractOgBrowser,
  extractSchemasBrowser,
  extractOgFromHtml,
  extractSchemasFromHtml,
  validateSchemas,
  launchBrowser: launchDefaultValidateBrowser,
};

export async function runValidate(
  url: string,
  options: ValidateOptions,
  deps: ValidateRunnerDeps = defaultValidateRunnerDeps,
): Promise<void> {
  const { useCurl, useOg } = options;
  const normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;

  const mode = useOg ? 'OpenGraph' : 'JSON-LD';
  console.log(`\n${bold(`Validating ${mode}${useCurl ? ' (curl/SSR)' : ' (browser)'}...`)}\n`);

  let data: OgData | Schema[];

  if (useCurl) {
    const html = deps.fetchHtmlCurl(normalizedUrl);
    data = useOg ? deps.extractOgFromHtml(html, normalizedUrl) : deps.extractSchemasFromHtml(html, normalizedUrl);
  } else {
    const browser = await deps.launchBrowser();
    try {
      if (useOg) {
        data = await deps.extractOgBrowser(browser, normalizedUrl);
      } else {
        data = await deps.extractSchemasBrowser(browser, normalizedUrl);
      }
    } finally {
      await browser.close();
    }
  }

  const countLabel = useOg ? `${Object.keys(data).length} tag(s)` : `${(data as Schema[]).length} schema(s)`;
  console.log(`${cyan`URL:`} ${normalizedUrl} → ${countLabel}\n`);

  if (!useOg) {
    await deps.validateSchemas(data as Schema[]);
  } else {
    console.log(`${yellow`OpenGraph validation not supported`}\n`);
  }
}
