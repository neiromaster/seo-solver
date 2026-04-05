import { afterAll, beforeEach, describe, expect, mock, test } from '#test-support/test-runtime';

const mockCommand = mock((config: unknown) => config);
const mockFlag = mock((config: unknown) => config);
const mockOption = mock((config: unknown) => config);
const mockOptional = mock((type: unknown) => ({ optional: type }));
const mockPositional = mock((config: unknown) => config);

const mockRunValidate = mock(async () => undefined);
const mockSafeRun = mock(async (fn: () => Promise<void>) => fn());
const mockResolveFetcher = mock<(input: { fetcher?: string }) => { fetcherId: 'basic' | 'browser'; warning?: string }>(
  () => ({ fetcherId: 'basic' }),
);
const mockWarn = mock(() => undefined);
let validateCommand: ReturnType<typeof import('./validate.command')['createValidateCommand']>;

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

const { createValidateCommand } = await import('./validate.command');

afterAll(() => {
  mock.restore();
});

describe('validateCommand', () => {
  beforeEach(() => {
    mockRunValidate.mockReset();
    mockSafeRun.mockReset();
    mockResolveFetcher.mockReset();
    mockWarn.mockReset();
    mockSafeRun.mockImplementation(async (fn: () => Promise<void>) => fn());
    mockResolveFetcher.mockReturnValue({ fetcherId: 'basic' });
    validateCommand = createValidateCommand({
      runValidate: mockRunValidate,
      safeRun: mockSafeRun,
      resolveFetcher: mockResolveFetcher,
      warn: mockWarn,
    });
  });

  test('name is validate', () => {
    expect(validateCommand.name).toBe('validate');
  });

  test('calls runValidate with default flags', async () => {
    await validateCommand.handler({ url: URL, fetcher: undefined, og: false, editor: undefined });

    expect(mockRunValidate).toHaveBeenCalledWith(URL, {
      fetcherId: 'basic',
      extractorId: 'jsonld',
      rendererId: 'terminal',
      editor: undefined,
    });
  });

  test('passes editor command when provided', async () => {
    await validateCommand.handler({ url: URL, fetcher: undefined, og: false, editor: 'code' });

    expect(mockRunValidate).toHaveBeenCalledWith(URL, {
      fetcherId: 'basic',
      extractorId: 'jsonld',
      rendererId: 'terminal',
      editor: 'code',
    });
  });

  test('passes all options through', async () => {
    mockResolveFetcher.mockReturnValue({ fetcherId: 'browser', warning: 'warn' });
    await validateCommand.handler({ url: URL, fetcher: undefined, og: true, editor: 'cursor' });

    expect(mockRunValidate).toHaveBeenCalledWith(URL, {
      fetcherId: 'browser',
      extractorId: 'opengraph',
      rendererId: 'terminal',
      editor: 'cursor',
    });
    expect(mockWarn).toHaveBeenCalledWith('warn');
  });

  test('uses fetcher resolver for explicit fetchers too', async () => {
    mockResolveFetcher.mockReturnValue({ fetcherId: 'browser' });
    await validateCommand.handler({ url: URL, fetcher: 'chrome:9222', og: false, editor: undefined });

    expect(mockRunValidate).toHaveBeenCalledWith(URL, {
      fetcherId: 'browser',
      extractorId: 'jsonld',
      rendererId: 'terminal',
      editor: undefined,
    });
  });

  test('does not call runValidate when safeRun does not execute callback', async () => {
    mockSafeRun.mockImplementation(async () => undefined);

    await validateCommand.handler({ url: URL, fetcher: undefined, og: false, editor: undefined });

    expect(mockRunValidate).not.toHaveBeenCalled();
  });
});
