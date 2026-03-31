import { expect, mock, test } from 'bun:test';
import type { Browser } from 'playwright';
import { createPlaywrightPageReader } from './playwright-page-reader';

test('page reader reads html and closes the browser context', async () => {
  const close = mock(async () => undefined);
  const page = {
    goto: mock(async () => undefined),
    url: mock(() => 'https://example.test/final'),
    content: mock(async () => '<html><body>Rendered</body></html>'),
  };
  const context = {
    newPage: mock(async () => page),
    close,
  };
  const browser = {
    newContext: mock(async () => context),
  } as unknown as Browser;

  const reader = createPlaywrightPageReader();
  const result = await reader.readHtml(browser, 'https://example.test/start');

  expect(result.finalUrl).toBe('https://example.test/final');
  expect(result.html).toContain('Rendered');
  expect(close).toHaveBeenCalledTimes(1);
});
