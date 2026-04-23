import type { Fetcher } from '@seo-solver/types/fetch';
import { FetchError } from '../core/errors.js';

export type BackendModule = {
  createFetcher(config?: unknown): Fetcher;
};

export type BackendLoader = () => Promise<BackendModule>;

const registry = new Map<string, BackendLoader>();

export function registerBackend(name: string, loader: BackendLoader): void {
  if (registry.has(name)) {
    throw new FetchError(`Backend "${name}" is already registered`, undefined, 'DUPLICATE_BACKEND', undefined, {
      backend: name,
      retryable: false,
    });
  }

  registry.set(name, loader);
}

export async function resolveBackend(name: string): Promise<BackendModule> {
  const loader = registry.get(name);

  if (!loader) {
    throw new FetchError(`Unknown fetch backend: ${name}`, undefined, 'UNKNOWN_BACKEND', undefined, {
      backend: name,
      retryable: false,
    });
  }

  return await loader();
}
