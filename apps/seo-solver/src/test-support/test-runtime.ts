import { vi } from 'vitest';

export { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

type MockFactory = typeof vi.fn & {
  module: typeof vi.doMock;
  restore: typeof vi.restoreAllMocks;
};

export const mock = Object.assign(
  <TArgs extends unknown[] = unknown[], TReturn = unknown>(implementation?: (...args: TArgs) => TReturn) =>
    vi.fn(implementation),
  {
    module: vi.doMock,
    restore: vi.restoreAllMocks,
  },
) as MockFactory;
