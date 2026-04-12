import { FetchError } from '@seo-solver/fetch';
import { registerBackend, resolveBackend } from '@seo-solver/fetch/advanced';
import type { Fetcher, FetcherConfig } from '@seo-solver/types/fetch';
import type { FetcherFlags } from '../flags/fetcher.js';

let backendsRegistered = false;

export async function resolveFetcher(flags: FetcherFlags): Promise<Fetcher> {
  ensureOptionalBackendsRegistered();

  const config: FetcherConfig = {
    timeout: flags.timeout,
    userAgent: flags.userAgent,
    retry: flags.retry ? { attempts: flags.retry } : undefined,
  };
  const name = flags.fetcher ?? 'native';

  try {
    const mod = await resolveBackend(name);

    if (typeof mod.createFetcher !== 'function') {
      throw new FetchError(
        `Backend "${name}" does not export createFetcher()`,
        undefined,
        'UNKNOWN_BACKEND',
        undefined,
        {
          backend: name,
          retryable: false,
        },
      );
    }

    return mod.createFetcher(config);
  } catch (error) {
    if (name === 'playwright' && isModuleNotFound(error, '@seo-solver/fetch-playwright')) {
      throw new FetchError(
        'Playwright fetcher requires package "@seo-solver/fetch-playwright"',
        undefined,
        'MISSING_OPTIONAL_BACKEND',
        undefined,
        {
          backend: 'playwright',
          installHint: 'pnpm add @seo-solver/fetch-playwright',
          retryable: false,
        },
      );
    }

    throw error;
  }
}

function ensureOptionalBackendsRegistered(): void {
  if (backendsRegistered) {
    return;
  }

  registerBackend('playwright', async () => {
    const moduleName = '@seo-solver/fetch-playwright';
    const mod = (await import(moduleName)) as {
      createFetcher?: (config?: FetcherConfig) => Fetcher;
    };

    return {
      createFetcher(config?: unknown) {
        return mod.createFetcher?.(config as FetcherConfig | undefined) as Fetcher;
      },
    };
  });

  backendsRegistered = true;
}

function isModuleNotFound(error: unknown, moduleName: string): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const nodeError = error as Error & { code?: string; cause?: unknown };

  if (nodeError.code === 'ERR_MODULE_NOT_FOUND' && error.message.includes(moduleName)) {
    return true;
  }

  if (nodeError.cause instanceof Error) {
    const cause = nodeError.cause as Error & { code?: string };
    return cause.code === 'ERR_MODULE_NOT_FOUND' && cause.message.includes(moduleName);
  }

  return false;
}
