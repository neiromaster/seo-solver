import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { NativeFetcher } from './native-fetcher';
import { createTestServer, type TestServer } from './test-support/test-server';

describe('NativeFetcher', () => {
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

  test('fetches basic html', async () => {
    const fetcher = new NativeFetcher();
    const result = await fetcher.fetch(`${server.baseUrl}/`);

    expect(result.statusCode).toBe(200);
    expect(result.body).toContain('<h1>Hello</h1>');
    expect(result.resourceType).toBe('html');
    expect(result.redirects).toEqual([]);
    expect(result.attempts).toBe(1);
    expect(result.timing).toBeGreaterThanOrEqual(0);
  });

  test('detects robots.txt', async () => {
    const fetcher = new NativeFetcher();
    const result = await fetcher.fetch(`${server.baseUrl}/robots.txt`);

    expect(result.resourceType).toBe('robots-txt');
    expect(result.body).toContain('Disallow: /admin');
  });

  test('fetches json', async () => {
    const fetcher = new NativeFetcher();
    const result = await fetcher.fetch(`${server.baseUrl}/data.json`);
    expect(result.resourceType).toBe('json');
    expect(JSON.parse(result.body)).toEqual({ key: 'value' });
  });

  test('tracks redirects', async () => {
    const fetcher = new NativeFetcher();
    const result = await fetcher.fetch(`${server.baseUrl}/double-redirect`);

    expect(result.url).toBe(`${server.baseUrl}/`);
    expect(result.redirects).toEqual([
      [302, `${server.baseUrl}/double-redirect`],
      [301, `${server.baseUrl}/redirect`],
    ]);
  });

  test('throws on redirect loop', async () => {
    const fetcher = new NativeFetcher();
    await expect(fetcher.fetch(`${server.baseUrl}/redirect-loop`)).rejects.toMatchObject({
      code: 'TOO_MANY_REDIRECTS',
    });
  });

  test('resolves relative redirects', async () => {
    const fetcher = new NativeFetcher();
    const result = await fetcher.fetch(`${server.baseUrl}/redirect-relative`);
    expect(result.url).toBe(`${server.baseUrl}/`);
  });

  test('times out', async () => {
    const fetcher = new NativeFetcher({ timeout: 50 });
    await expect(fetcher.fetch(`${server.baseUrl}/never`)).rejects.toMatchObject({
      code: 'TIMEOUT',
    });
  });

  test('supports external abort', async () => {
    const controller = new AbortController();
    const fetcher = new NativeFetcher();
    const promise = fetcher.fetch(`${server.baseUrl}/slow`, { signal: controller.signal });
    setTimeout(() => controller.abort(new Error('cancelled')), 50);
    await expect(promise).rejects.toMatchObject({ code: 'ABORTED' });
  });

  test('fails immediately for pre-aborted signal', async () => {
    const controller = new AbortController();
    controller.abort(new Error('already aborted'));
    const fetcher = new NativeFetcher();

    await expect(fetcher.fetch(`${server.baseUrl}/`, { signal: controller.signal })).rejects.toMatchObject({
      code: 'ABORTED',
    });
  });

  test('returns 404 results without throwing', async () => {
    const fetcher = new NativeFetcher();
    const result = await fetcher.fetch(`${server.baseUrl}/missing`);
    expect(result.statusCode).toBe(404);
  });

  test('sends custom headers and user agent', async () => {
    const fetcher = new NativeFetcher({ userAgent: 'config-agent' });
    await fetcher.fetch(`${server.baseUrl}/`, { headers: { 'x-test': 'yes' } });

    expect(server.getRequestHeaders('/')['x-test']).toBe('yes');
    expect(server.getRequestHeaders('/')['user-agent']).toBe('config-agent');
  });

  test('normalizes response headers', async () => {
    const fetcher = new NativeFetcher();
    const result = await fetcher.fetch(`${server.baseUrl}/`);
    expect(Object.keys(result.headers)).toContain('content-type');
  });

  test('handles missing content-type', async () => {
    const fetcher = new NativeFetcher();
    const result = await fetcher.fetch(`${server.baseUrl}/no-content-type`);
    expect(result.resourceType).toBe('binary');
  });

  test('handles empty bodies', async () => {
    const fetcher = new NativeFetcher();
    const result = await fetcher.fetch(`${server.baseUrl}/empty-body`);
    expect(result.body).toBe('');
  });

  test('retries on 500 and returns success', async () => {
    const fetcher = new NativeFetcher({ retry: { attempts: 3, delay: 10, retryOn: [500] } });
    const result = await fetcher.fetch(`${server.baseUrl}/retry-then-ok`);

    expect(result.attempts).toBe(3);
    expect(result.statusCode).toBe(200);
  });

  test('respects retry-after', async () => {
    const startedAt = Date.now();
    const fetcher = new NativeFetcher({ retry: { attempts: 2, retryOn: [429] } });
    const result = await fetcher.fetch(`${server.baseUrl}/rate-limited`);

    expect(result.statusCode).toBe(200);
    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(900);
  });

  test('returns last result when retries are exhausted', async () => {
    const fetcher = new NativeFetcher({ retry: { attempts: 2, delay: 10, retryOn: [500] } });
    const result = await fetcher.fetch(`${server.baseUrl}/always-500`);
    expect(result.statusCode).toBe(500);
    expect(result.attempts).toBe(2);
  });

  test('does not retry by default', async () => {
    const fetcher = new NativeFetcher();
    const result = await fetcher.fetch(`${server.baseUrl}/retry-then-ok`);
    expect(result.statusCode).toBe(500);
    expect(result.attempts).toBe(1);
  });

  test('maps dns failures to network errors', async () => {
    const fetcher = new NativeFetcher();
    await expect(fetcher.fetch('http://nonexistent.invalid/')).rejects.toMatchObject({
      code: 'NETWORK',
    });
  });

  test('maps invalid urls', async () => {
    const fetcher = new NativeFetcher();
    await expect(fetcher.fetch('not-a-url')).rejects.toMatchObject({ code: 'INVALID_URL' });
  });

  test('merges config and request options', async () => {
    const fetcher = new NativeFetcher({ timeout: 1000, retry: { attempts: 2, retryOn: [500] } });
    const result = await fetcher.fetch(`${server.baseUrl}/retry-then-ok`, {
      retry: { attempts: 3 },
      timeout: 2000,
    });

    expect(result.attempts).toBe(3);
  });

  test('dispose is safe to call twice', async () => {
    const fetcher = new NativeFetcher();
    await expect(fetcher.dispose()).resolves.toBeUndefined();
    await expect(fetcher.dispose()).resolves.toBeUndefined();
  });

  test('timing includes retries', async () => {
    const fetcher = new NativeFetcher({ retry: { attempts: 2, delay: 50, retryOn: [429] } });
    const result = await fetcher.fetch(`${server.baseUrl}/rate-limited`);
    expect(result.timing).toBeGreaterThanOrEqual(900);
  });

  test('decodes latin1 responses', async () => {
    const fetcher = new NativeFetcher();
    const result = await fetcher.fetch(`${server.baseUrl}/charset-latin`);
    expect(result.body).toContain('olá');
  });
});
