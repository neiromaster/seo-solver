import { expect, mock, test } from 'bun:test';
import { createPlaywrightBrowserClient } from './playwright-browser-client';

test('browser client launches via injected chromium type', async () => {
  const browser = {} as never;
  const launch = mock(async () => browser as never);
  const connectOverCDP = mock(async () => browser as never);
  const client = createPlaywrightBrowserClient({
    chromiumType: {
      launch,
      connectOverCDP,
    },
  });

  const result = await client.launch();

  expect(result).toBe(browser);
  expect(launch).toHaveBeenCalledTimes(1);
});

test('browser client normalizes host targets for cdp connection', async () => {
  const browser = {} as never;
  const launch = mock(async () => browser as never);
  const connectOverCDP = mock(async () => browser as never);
  const client = createPlaywrightBrowserClient({
    chromiumType: {
      launch,
      connectOverCDP,
    },
  });

  await client.connect('localhost:9222');

  expect(connectOverCDP).toHaveBeenCalledWith('http://localhost:9222');
});
