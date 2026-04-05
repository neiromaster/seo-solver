import { afterAll, beforeEach, describe, expect, mock, test } from '#test-support/test-runtime';

const mockCommand = mock((config: unknown) => config);
const mockFlag = mock((config: unknown) => config);
const mockOption = mock((config: unknown) => config);
const mockOptional = mock((type: unknown) => ({ optional: type }));
const mockPositional = mock((config: unknown) => config);

const mockRunInspect = mock(async () => undefined);
const mockSafeRun = mock(async (fn: () => Promise<void>) => fn());
const mockResolveFetcher = mock<(input: { fetcher?: string }) => { fetcherId: 'basic' | 'browser'; warning?: string }>(
  () => ({ fetcherId: 'basic' }),
);
const mockWarn = mock(() => undefined);
let inspectCommand: ReturnType<typeof import('./inspect.command')['createInspectCommand']>;

const URL = 'https://example.com';

mock.module('cmd-ts', () => ({
  command: mockCommand,
  boolean: 'boolean-type',
  string: 'string-type',
  flag: mockFlag,
  option: mockOption,
  optional: mockOptional,
  positional: mockPositional,
}));

const { createInspectCommand } = await import('./inspect.command');

afterAll(() => {
  mock.restore();
});

describe('inspectCommand', () => {
  beforeEach(() => {
    mockRunInspect.mockReset();
    mockSafeRun.mockReset();
    mockResolveFetcher.mockReset();
    mockWarn.mockReset();
    mockSafeRun.mockImplementation(async (fn: () => Promise<void>) => fn());
    mockResolveFetcher.mockReturnValue({ fetcherId: 'basic' });
    inspectCommand = createInspectCommand({
      runInspect: mockRunInspect,
      safeRun: mockSafeRun,
      resolveFetcher: mockResolveFetcher,
      warn: mockWarn,
    });
  });

  test('name is inspect', () => {
    expect(inspectCommand.name).toBe('inspect');
  });

  test('calls runInspect with default flags', async () => {
    await inspectCommand.handler({ url: URL, fetcher: undefined, og: false, editor: undefined });
    expect(mockRunInspect).toHaveBeenCalledWith(URL, {
      fetcherId: 'basic',
      extractorId: 'jsonld',
      rendererId: 'terminal',
      editor: undefined,
    });
  });

  test('uses editor-diff renderer when editor is provided', async () => {
    await inspectCommand.handler({ url: URL, fetcher: undefined, og: true, editor: 'code' });
    expect(mockRunInspect).toHaveBeenCalledWith(URL, {
      fetcherId: 'basic',
      extractorId: 'opengraph',
      rendererId: 'editor-diff',
      editor: 'code',
    });
  });
});
