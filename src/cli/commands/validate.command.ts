import { chromium } from 'playwright';
import { fetchHtmlCurl } from '#core/fetchers/curl.fetcher';
import { extractOgBrowser, extractSchemasBrowser } from '#core/fetchers/playwright.fetcher';
import { extractOgFromHtml, extractSchemasFromHtml } from '#core/parsers/index';
import { validateSchemas } from '#core/validators/schema-org.validator';
import { BOLD, CYAN, RESET, YELLOW } from '#lib/colors';
import type { OgData, Schema } from '#types';

type ValidateOptions = {
  useCurl: boolean;
  useOg: boolean;
};

export async function validateCommand(url: string, options: ValidateOptions): Promise<void> {
  const { useCurl, useOg } = options;
  const mode = useOg ? 'OpenGraph' : 'JSON-LD';
  console.log(`\n${BOLD}Validating ${mode}${useCurl ? ' (curl/SSR)' : ' (browser)'}...${RESET}\n`);

  let data: OgData | Schema[];

  if (useCurl) {
    const html = fetchHtmlCurl(url);
    data = useOg ? extractOgFromHtml(html) : extractSchemasFromHtml(html);
  } else {
    const browser = await chromium.launch();
    try {
      if (useOg) {
        data = await extractOgBrowser(browser, url);
      } else {
        data = await extractSchemasBrowser(browser, url);
      }
    } finally {
      await browser.close();
    }
  }

  const countLabel = useOg ? `${Object.keys(data).length} tag(s)` : `${(data as Schema[]).length} schema(s)`;
  console.log(`${CYAN}URL:${RESET} ${url} → ${countLabel}\n`);

  if (!useOg) {
    await validateSchemas(data as Schema[]);
  } else {
    console.log(`${YELLOW}OpenGraph validation not supported${RESET}\n`);
  }
}
