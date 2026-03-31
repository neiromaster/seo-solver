import { expect, test } from 'bun:test';
import { BasicFetcher } from './basic-fetcher';

test('basic fetcher returns fetched source from the injected http client', async () => {
  const fetcher = new BasicFetcher({
    get: async (url) => ({
      finalUrl: url,
      statusCode: 200,
      contentType: 'text/html',
      body: '<html></html>',
      headers: { 'content-type': 'text/html' },
    }),
  });

  const result = await fetcher.fetch({ url: 'https://example.com', fetcherId: 'basic' });

  expect(result.finalUrl).toBe('https://example.com');
  expect(result.statusCode).toBe(200);
  expect(result.body).toContain('<html>');
});
