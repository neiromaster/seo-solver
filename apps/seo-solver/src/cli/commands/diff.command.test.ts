import { afterAll, beforeEach, describe, expect, mock, test } from '#test-support/test-runtime';

const mockCommand = mock((config: unknown) => config);
const mockFlag = mock((config: unknown) => config);
const mockOption = mock((config: unknown) => config);
const mockOptional = mock((type: unknown) => ({ optional: type }));
const mockPositional = mock((config: unknown) => config);

const mockRunDiff = mock(async () => undefined);
const mockSafeRun = mock(async (fn: () => Promise<void>) => fn());
const mockResolveFetcher = mock<(input: { fetcher?: string }) => { fetcherId: 'basic' | 'browser'; warning?: string }>(
  () => ({ fetcherId: 'basic' }),
);
const mockWarn = mock(() => undefined);
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
    mockResolveFetcher.mockReset();
    mockWarn.mockReset();
    mockSafeRun.mockImplementation(async (fn: () => Promise<void>) => fn());
    mockResolveFetcher.mockReturnValue({ fetcherId: 'basic' });
    diffCommand = createDiffCommand({
      runDiff: mockRunDiff,
      safeRun: mockSafeRun,
      resolveFetcher: mockResolveFetcher,
      warn: mockWarn,
    });
  });

  test('name is diff', () => {
    expect(diffCommand.name).toBe('diff');
  });

  test('calls runDiff with default flags', async () => {
    await diffCommand.handler({
      url1: URL1,
      url2: URL2,
      fetcher: undefined,
      og: false,
      editor: undefined,
    });

    expect(mockRunDiff).toHaveBeenCalledWith(URL1, URL2, {
      fetcherId: 'basic',
      extractorId: 'jsonld',
      rendererId: 'terminal',
      editor: undefined,
    });
  });

  test('passes editor command when provided', async () => {
    await diffCommand.handler({ url1: URL1, url2: URL2, fetcher: undefined, og: false, editor: 'cursor' });

    expect(mockRunDiff).toHaveBeenCalledWith(URL1, URL2, {
      fetcherId: 'basic',
      extractorId: 'jsonld',
      rendererId: 'editor-diff',
      editor: 'cursor',
    });
  });

  test('passes all options through', async () => {
    mockResolveFetcher.mockReturnValue({ fetcherId: 'browser', warning: 'warn' });
    await diffCommand.handler({ url1: URL1, url2: URL2, fetcher: undefined, og: true, editor: 'surf' });

    expect(mockRunDiff).toHaveBeenCalledWith(URL1, URL2, {
      fetcherId: 'browser',
      extractorId: 'opengraph',
      rendererId: 'editor-diff',
      editor: 'surf',
    });
    expect(mockWarn).toHaveBeenCalledWith('warn');
  });

  test('uses fetcher resolver for explicit fetchers too', async () => {
    mockResolveFetcher.mockReturnValue({ fetcherId: 'browser' });
    await diffCommand.handler({ url1: URL1, url2: URL2, fetcher: 'chrome', og: true, editor: undefined });

    expect(mockRunDiff).toHaveBeenCalledWith(URL1, URL2, {
      fetcherId: 'browser',
      extractorId: 'opengraph',
      rendererId: 'terminal',
      editor: undefined,
    });
  });

  test('does not call runDiff when safeRun does not execute callback', async () => {
    mockSafeRun.mockImplementation(async () => undefined);

    await diffCommand.handler({
      url1: URL1,
      url2: URL2,
      fetcher: undefined,
      og: false,
      editor: undefined,
    });

    expect(mockRunDiff).not.toHaveBeenCalled();
  });
});
