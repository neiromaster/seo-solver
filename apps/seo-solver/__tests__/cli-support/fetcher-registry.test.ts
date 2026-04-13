import { describe, expect, test } from 'vitest';
import { resolveFetcher } from '../../src/cli-support/fetcher-registry';

describe('resolveFetcher', () => {
  test('returns the native fetcher by default', async () => {
    const fetcher = await resolveFetcher({
      fetcher: undefined,
      timeout: undefined,
      userAgent: undefined,
      retry: undefined,
      retryDelayMs: undefined,
      retryBackoff: undefined,
      respectRetryAfter: undefined,
    });

    expect(fetcher.name).toBe('native');
    await fetcher.dispose();
  });

  test('returns the playwright fetcher when the optional backend is installed', async () => {
    const fetcher = await resolveFetcher({
      fetcher: 'playwright',
      timeout: undefined,
      userAgent: undefined,
      retry: undefined,
      retryDelayMs: undefined,
      retryBackoff: undefined,
      respectRetryAfter: undefined,
    });

    expect(fetcher.name).toBe('playwright');
    await fetcher.dispose();
  });

  test('throws a helpful error for unknown fetchers', async () => {
    await expect(
      resolveFetcher({
        fetcher: 'unknown',
        timeout: undefined,
        userAgent: undefined,
        retry: undefined,
        retryDelayMs: undefined,
        retryBackoff: undefined,
        respectRetryAfter: undefined,
      }),
    ).rejects.toMatchObject({
      code: 'UNKNOWN_BACKEND',
      backend: 'unknown',
    });
  });
});
