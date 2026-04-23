import { chromium } from 'playwright';
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { createTestServer, type TestServer } from '../../../../test-support/test-server.js';
import { pageToFetchResult } from './page-to-fetch-result.js';

describe('pageToFetchResult', () => {
  let browser: Awaited<ReturnType<typeof chromium.launch>>;
  let server: TestServer;

  beforeAll(async () => {
    browser = await chromium.launch();
    server = await createTestServer();
  });

  afterAll(async () => {
    await browser.close();
    await server.close();
  });

  beforeEach(() => {
    server.reset();
  });

  test('uses rendered dom for html pages', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const response = await page.goto(`${server.baseUrl}/rendered`, { waitUntil: 'domcontentloaded' });
    if (!response) {
      throw new Error('Expected navigation response');
    }

    const result = await pageToFetchResult(page, response, `${server.baseUrl}/rendered`, [], 12, 1);
    expect(result.body).toContain('hydrated');
    expect(result.body).toContain('Hydrated Title');
    expect(result.resourceType).toBe('html');

    await context.close();
  });

  test('uses raw response text for json responses', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const response = await page.goto(`${server.baseUrl}/data.json`, { waitUntil: 'domcontentloaded' });
    if (!response) {
      throw new Error('Expected navigation response');
    }

    const result = await pageToFetchResult(page, response, `${server.baseUrl}/data.json`, [], 12, 1);
    expect(result.body).toBe('{"key":"value"}');
    expect(result.resourceType).toBe('json');

    await context.close();
  });

  test('normalizes headers', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const response = await page.goto(`${server.baseUrl}/`, { waitUntil: 'domcontentloaded' });
    if (!response) {
      throw new Error('Expected navigation response');
    }

    const result = await pageToFetchResult(page, response, `${server.baseUrl}/`, [], 12, 1);
    expect(Object.keys(result.headers)).toContain('content-type');

    await context.close();
  });
});
