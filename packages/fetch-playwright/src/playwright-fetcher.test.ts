import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { fetchUrl, PlaywrightFetcher } from './playwright-fetcher';
import { createTestServer, type TestServer } from './test-support/test-server';

describe('PlaywrightFetcher', () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  beforeEach(() => {
    server.reset();
  });

  test('fetches html pages', async () => {
    const fetcher = new PlaywrightFetcher();
    const result = await fetcher.fetch(`${server.baseUrl}/`);

    expect(result.statusCode).toBe(200);
    expect(result.resourceType).toBe('html');
    expect(result.body).toContain('<h1>Hello</h1>');

    await fetcher.dispose();
  });

  test('captures rendered dom', async () => {
    const fetcher = new PlaywrightFetcher();
    const result = await fetcher.fetch(`${server.baseUrl}/rendered`);

    expect(result.body).toContain('hydrated');
    expect(result.body).toContain('Hydrated Title');

    await fetcher.dispose();
  });

  test('tracks redirects', async () => {
    const fetcher = new PlaywrightFetcher();
    const result = await fetcher.fetch(`${server.baseUrl}/double-redirect`);

    expect(result.redirects).toEqual([
      [302, `${server.baseUrl}/double-redirect`],
      [301, `${server.baseUrl}/redirect`],
    ]);

    await fetcher.dispose();
  });

  test('enforces max redirects', async () => {
    const fetcher = new PlaywrightFetcher({ maxRedirects: 1 });
    await expect(fetcher.fetch(`${server.baseUrl}/double-redirect`)).rejects.toMatchObject({
      code: 'TOO_MANY_REDIRECTS',
    });
    await fetcher.dispose();
  });

  test('times out', async () => {
    const fetcher = new PlaywrightFetcher({ timeout: 50 });
    await expect(fetcher.fetch(`${server.baseUrl}/never`)).rejects.toMatchObject({ code: 'TIMEOUT' });
    await fetcher.dispose();
  });

  test('supports abort signals', async () => {
    const controller = new AbortController();
    const fetcher = new PlaywrightFetcher();
    const promise = fetcher.fetch(`${server.baseUrl}/slow`, { signal: controller.signal });
    setTimeout(() => controller.abort(new Error('cancelled')), 50);
    await expect(promise).rejects.toMatchObject({ code: 'ABORTED' });
    await fetcher.dispose();
  });

  test('passes through 404 results', async () => {
    const fetcher = new PlaywrightFetcher();
    const result = await fetcher.fetch(`${server.baseUrl}/missing`);

    expect(result.statusCode).toBe(404);

    await fetcher.dispose();
  });

  test('maps invalid urls', async () => {
    const fetcher = new PlaywrightFetcher();
    await expect(fetcher.fetch('not-a-url')).rejects.toMatchObject({ code: 'INVALID_URL' });
    await fetcher.dispose();
  });

  test('maps network failures', async () => {
    const fetcher = new PlaywrightFetcher({ timeout: 2000 });
    await expect(fetcher.fetch('http://nonexistent.invalid/')).rejects.toMatchObject({ code: 'NETWORK' });
    await fetcher.dispose();
  });

  test('fetch after dispose throws', async () => {
    const fetcher = new PlaywrightFetcher();
    await fetcher.dispose();
    await expect(fetcher.fetch(`${server.baseUrl}/`)).rejects.toMatchObject({ code: 'DISPOSED_FETCHER' });
  });

  test('supports simple fetchUrl helper', async () => {
    const result = await fetchUrl(`${server.baseUrl}/`);

    expect(result.statusCode).toBe(200);
    expect(result.resourceType).toBe('html');
    expect(result.body).toContain('<h1>Hello</h1>');
  });

  test('supports parallel fetches', async () => {
    const fetcher = new PlaywrightFetcher();
    const [a, b, c] = await Promise.all([
      fetcher.fetch(`${server.baseUrl}/`),
      fetcher.fetch(`${server.baseUrl}/rendered`),
      fetcher.fetch(`${server.baseUrl}/data.json`),
    ]);

    expect(a.statusCode).toBe(200);
    expect(b.body).toContain('hydrated');
    expect(c.resourceType).toBe('json');

    await fetcher.dispose();
  });

  test('retries on retryable responses', async () => {
    const fetcher = new PlaywrightFetcher({ retry: { attempts: 3, delay: 10, retryOn: [500] } });
    const result = await fetcher.fetch(`${server.baseUrl}/retry-then-ok`);

    expect(result.statusCode).toBe(200);
    expect(result.attempts).toBe(3);
    expect(server.getRequestCount('/retry-then-ok')).toBe(3);

    await fetcher.dispose();
  });

  test('applies custom headers and user agent', async () => {
    const fetcher = new PlaywrightFetcher({ userAgent: 'config-agent' });
    await fetcher.fetch(`${server.baseUrl}/`, { headers: { 'x-test': 'yes' } });

    expect(server.getRequestHeaders('/')['x-test']).toBe('yes');
    expect(server.getRequestHeaders('/')['user-agent']).toBe('config-agent');

    await fetcher.dispose();
  });

  test('blocks configured resources', async () => {
    const fetcher = new PlaywrightFetcher({ blockResourceTypes: ['image'] });
    await fetcher.fetch(`${server.baseUrl}/rendered`);

    expect(server.getRequestCount('/image.png')).toBe(0);

    await fetcher.dispose();
  });

  test('can disable javascript', async () => {
    const fetcher = new PlaywrightFetcher({ javaScriptEnabled: false });
    const result = await fetcher.fetch(`${server.baseUrl}/rendered`);

    expect(result.body).toContain('<div id="app">raw</div>');
    expect(result.body).not.toContain('<meta property="og:title" content="Hydrated Title">');

    await fetcher.dispose();
  });

  test('applies custom viewport', async () => {
    const fetcher = new PlaywrightFetcher({ viewport: { height: 700, width: 500 } });
    const result = await fetcher.fetch(`${server.baseUrl}/viewport`);

    expect(result.body).toContain('mobile');

    await fetcher.dispose();
  });

  test('returns non-html responses as raw text', async () => {
    const fetcher = new PlaywrightFetcher();
    const result = await fetcher.fetch(`${server.baseUrl}/robots.txt`);

    expect(result.resourceType).toBe('robots-txt');
    expect(result.body).toContain('Disallow: /admin');

    await fetcher.dispose();
  });
});
