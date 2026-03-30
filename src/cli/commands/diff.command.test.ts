import { afterAll, beforeEach, describe, expect, mock, test } from 'bun:test';

const mockCommand = mock((config: unknown) => config);
const mockFlag = mock((config: unknown) => config);
const mockOption = mock((config: unknown) => config);
const mockOptional = mock((type: unknown) => ({ optional: type }));
const mockPositional = mock((config: unknown) => config);

const mockRunDiff = mock(async () => undefined);
const mockSafeRun = mock(async (fn: () => Promise<void>) => fn());
let diffCommand: ReturnType<typeof import('./diff.command')['createDiffCommand']>;

const URL1 = 'https://example.com';
const URL2 = 'https://other.com';

mock.module('cmd-ts', () => ({
  command: mockCommand,
  boolean: 'boolean-type',
  string: 'string-type',
  flag: mockFlag,
  option: mockOption,
  optional: mockOptional,
  positional: mockPositional,
}));

const { createDiffCommand } = await import('./diff.command');

afterAll(() => {
  mock.restore();
});

describe('diffCommand', () => {
  beforeEach(() => {
    mockRunDiff.mockReset();
    mockSafeRun.mockReset();
    mockSafeRun.mockImplementation(async (fn: () => Promise<void>) => fn());
    diffCommand = createDiffCommand({ runDiff: mockRunDiff, safeRun: mockSafeRun });
  });

  test('name is diff', () => {
    expect(diffCommand.name).toBe('diff');
  });

  test('calls runDiff with default flags', async () => {
    await diffCommand.handler({ url1: URL1, url2: URL2, curl: false, og: false, editor: undefined });

    expect(mockRunDiff).toHaveBeenCalledWith(URL1, URL2, { useCurl: false, useOg: false, editor: undefined });
  });

  test('passes editor command when provided', async () => {
    await diffCommand.handler({ url1: URL1, url2: URL2, curl: false, og: false, editor: 'cursor' });

    expect(mockRunDiff).toHaveBeenCalledWith(URL1, URL2, { useCurl: false, useOg: false, editor: 'cursor' });
  });

  test('passes all options through', async () => {
    await diffCommand.handler({ url1: URL1, url2: URL2, curl: true, og: true, editor: 'surf' });

    expect(mockRunDiff).toHaveBeenCalledWith(URL1, URL2, { useCurl: true, useOg: true, editor: 'surf' });
  });

  test('does not call runDiff when safeRun does not execute callback', async () => {
    mockSafeRun.mockImplementation(async () => undefined);

    await diffCommand.handler({ url1: URL1, url2: URL2, curl: false, og: false, editor: undefined });

    expect(mockRunDiff).not.toHaveBeenCalled();
  });
});
