import { describe, expect, test } from 'vitest';
import { registerNativeBackend, resolveBackend } from './advanced.js';

describe('advanced fetch runtime', () => {
  test('registers the native backend explicitly', async () => {
    registerNativeBackend();

    const backend = await resolveBackend('native');
    const fetcher = backend.createFetcher();

    expect(fetcher.name).toBe('native');
    await fetcher.dispose();
  });

  test('native backend registration is idempotent', async () => {
    expect(() => registerNativeBackend()).not.toThrow();
    expect(() => registerNativeBackend()).not.toThrow();
  });
});
