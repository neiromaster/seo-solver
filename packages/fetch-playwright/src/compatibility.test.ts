import { NativeFetcher } from '@seo-solver/fetch';
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { createTestServer, type TestServer } from '../../../test-support/test-server.js';
import { PlaywrightFetcher } from './playwright-fetcher.js';

describe('fetcher compatibility', () => {
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

  test('returns compatible results for static html', async () => {
    const nativeFetcher = new NativeFetcher();
    const playwrightFetcher = new PlaywrightFetcher();

    const [nativeResult, playwrightResult] = await Promise.all([
      nativeFetcher.fetch(`${server.baseUrl}/`),
      playwrightFetcher.fetch(`${server.baseUrl}/`),
    ]);

    expect(playwrightResult.statusCode).toBe(nativeResult.statusCode);
    expect(playwrightResult.resourceType).toBe(nativeResult.resourceType);
    expect(playwrightResult.redirects).toEqual(nativeResult.redirects);
    expect(playwrightResult.body).toContain('<h1>Hello</h1>');

    await nativeFetcher.dispose();
    await playwrightFetcher.dispose();
  });

  test('create-like interface contract is satisfied', async () => {
    const fetcher = new PlaywrightFetcher();

    expect(fetcher.name).toBe('playwright');
    expect(typeof fetcher.fetch).toBe('function');
    expect(typeof fetcher.dispose).toBe('function');

    await fetcher.dispose();
  });
});
