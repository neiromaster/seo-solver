import { expect, mock, test } from 'bun:test';
import type { Browser } from 'playwright';
import { createBrowserHtmlClient } from './browser-html-client';

test('browser html client launches, reads html, and closes browser', async () => {
  const browser = {
    close: mock(async () => undefined),
  } as unknown as Browser;
  const client = createBrowserHtmlClient({
    browserClient: {
      launch: mock(async () => browser),
      connect: mock(async () => browser),
    },
    pageReader: {
      readHtml: mock(async () => ({
        finalUrl: 'https://example.test/rendered',
        html: '<html><body>Rendered</body></html>',
      })),
    },
    launchBrowser: async (launch) => launch(),
  });

  const result = await client.get('https://example.test/start');

  expect(result.finalUrl).toBe('https://example.test/rendered');
  expect(result.html).toContain('Rendered');
  expect(browser.close).toHaveBeenCalledTimes(1);
});

test('browser html client closes browser when page reading fails', async () => {
  const browser = {
    close: mock(async () => undefined),
  } as unknown as Browser;
  const client = createBrowserHtmlClient({
    browserClient: {
      launch: mock(async () => browser),
      connect: mock(async () => browser),
    },
    pageReader: {
      readHtml: mock(async () => {
        throw new Error('page read failed');
      }),
    },
    launchBrowser: async (launch) => launch(),
  });

  await expect(client.get('https://example.test/start')).rejects.toThrow('page read failed');
  expect(browser.close).toHaveBeenCalledTimes(1);
});
