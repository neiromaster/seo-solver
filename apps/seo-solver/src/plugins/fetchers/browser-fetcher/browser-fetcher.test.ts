import { expect, mock, test } from '#test-support/test-runtime';
import { BrowserFetcher } from './browser-fetcher';

test('browser fetcher reads rendered html through browser html client', async () => {
  const fetcher = new BrowserFetcher({
    browserHtmlClient: {
      get: mock(async () => ({
        finalUrl: 'https://example.test/final',
        html: '<html><body>Rendered</body></html>',
      })),
    },
  });

  const result = await fetcher.fetch({ url: 'https://example.test/start', fetcherId: 'browser' });

  expect(result.finalUrl).toBe('https://example.test/final');
  expect(result.body).toContain('Rendered');
});

test('browser fetcher wraps browser html client failures', async () => {
  const fetcher = new BrowserFetcher({
    browserHtmlClient: {
      get: mock(async () => {
        throw new Error('page read failed');
      }),
    },
  });

  await expect(fetcher.fetch({ url: 'https://example.test/start', fetcherId: 'browser' })).rejects.toThrow(
    'Browser fetch failed',
  );
});
