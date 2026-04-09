import { createFetcher as createNativeFetcher } from '@seo-solver/fetch';
import type { Fetcher, FetcherConfig } from '@seo-solver/types';
import type { FetcherFlags } from '../flags/fetcher.js';
import { CLIError } from './error-handler.js';

export async function resolveFetcher(flags: FetcherFlags): Promise<Fetcher> {
  const config: FetcherConfig = {
    timeout: flags.timeout,
    userAgent: flags.userAgent,
    retry: flags.retry ? { attempts: flags.retry } : undefined,
  };
  const name = flags.fetcher ?? 'native';

  if (name === 'native') {
    return createNativeFetcher(config);
  }

  const pkg = `@seo-solver/fetch-${name}`;

  try {
    const mod = (await import(pkg)) as { createFetcher?: (config?: FetcherConfig) => Fetcher };

    if (typeof mod.createFetcher !== 'function') {
      throw new CLIError(`Package "${pkg}" does not export createFetcher()`);
    }

    return mod.createFetcher(config);
  } catch (error) {
    if (isModuleNotFound(error, pkg)) {
      throw new CLIError(`Fetcher "${name}" requires package "${pkg}".\nInstall it: pnpm add ${pkg}`);
    }

    throw error;
  }
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
