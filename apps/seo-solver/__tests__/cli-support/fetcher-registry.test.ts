import { describe, expect, test } from 'vitest';
import { resolveFetcher } from '../../src/cli-support/fetcher-registry.js';

describe('resolveFetcher', () => {
  test('returns the native fetcher by default', async () => {
    const fetcher = await resolveFetcher({
      fetcher: undefined,
      timeout: undefined,
      userAgent: undefined,
      retry: undefined,
    });

    expect(fetcher.name).toBe('native');
    await fetcher.dispose();
  });

  test('throws a helpful error for missing optional fetchers', async () => {
    await expect(
      resolveFetcher({
        fetcher: 'playwright',
        timeout: undefined,
        userAgent: undefined,
        retry: undefined,
      }),
    ).rejects.toMatchObject({
      code: 'MISSING_OPTIONAL_BACKEND',
      backend: 'playwright',
      installHint: 'pnpm add @seo-solver/fetch-playwright',
    });
  });

  test('throws a helpful error for unknown fetchers', async () => {
    await expect(
      resolveFetcher({
        fetcher: 'unknown',
        timeout: undefined,
        userAgent: undefined,
        retry: undefined,
      }),
    ).rejects.toMatchObject({
      code: 'UNKNOWN_BACKEND',
      backend: 'unknown',
    });
  });
});
