import { describe, expect, test } from 'vitest';
import { CLIError } from '../../src/shared/error-handler.js';
import { resolveFetcher } from '../../src/shared/resolve-fetcher.js';

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
    ).rejects.toEqual(
      new CLIError(
        'Fetcher "playwright" requires package "@seo-solver/fetch-playwright".\nInstall it: pnpm add @seo-solver/fetch-playwright',
      ),
    );
  });

  test('throws a helpful error for unknown fetchers', async () => {
    await expect(
      resolveFetcher({
        fetcher: 'unknown',
        timeout: undefined,
        userAgent: undefined,
        retry: undefined,
      }),
    ).rejects.toEqual(
      new CLIError(
        'Fetcher "unknown" requires package "@seo-solver/fetch-unknown".\nInstall it: pnpm add @seo-solver/fetch-unknown',
      ),
    );
  });
});
