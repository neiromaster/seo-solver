import { afterAll, beforeEach, describe, expect, mock, test } from 'bun:test';
import { CURL_DEPRECATION_WARNING } from '#cli/fetcher-option';

const mockCommand = mock((config: unknown) => config);
const mockFlag = mock((config: unknown) => config);
const mockOption = mock((config: unknown) => config);
const mockOptional = mock((type: unknown) => ({ optional: type }));
const mockPositional = mock((config: unknown) => config);

const mockRunValidate = mock(async () => undefined);
const mockSafeRun = mock(async (fn: () => Promise<void>) => fn());
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
    mockWarn.mockReset();
    mockSafeRun.mockImplementation(async (fn: () => Promise<void>) => fn());
    validateCommand = createValidateCommand({ runValidate: mockRunValidate, safeRun: mockSafeRun, warn: mockWarn });
  });

  test('name is validate', () => {
    expect(validateCommand.name).toBe('validate');
  });

  test('calls runValidate with default flags', async () => {
    await validateCommand.handler({ url: URL, curl: false, fetcher: undefined, og: false, editor: undefined });

    expect(mockRunValidate).toHaveBeenCalledWith(URL, {
      fetcher: { type: 'basic' },
      useOg: false,
      editor: undefined,
    });
  });

  test('passes editor command when provided', async () => {
    await validateCommand.handler({ url: URL, curl: false, fetcher: undefined, og: false, editor: 'code' });

    expect(mockRunValidate).toHaveBeenCalledWith(URL, {
      fetcher: { type: 'basic' },
      useOg: false,
      editor: 'code',
    });
  });

  test('passes all options through', async () => {
    await validateCommand.handler({ url: URL, curl: true, fetcher: undefined, og: true, editor: 'cursor' });

    expect(mockRunValidate).toHaveBeenCalledWith(URL, {
      fetcher: { type: 'curl' },
      useOg: true,
      editor: 'cursor',
    });
    expect(mockWarn).toHaveBeenCalledWith(CURL_DEPRECATION_WARNING);
  });

  test('lets explicit fetcher override deprecated curl flag', async () => {
    await validateCommand.handler({ url: URL, curl: true, fetcher: 'chrome:9222', og: false, editor: undefined });

    expect(mockRunValidate).toHaveBeenCalledWith(URL, {
      fetcher: { type: 'chrome', mode: 'connect', target: 'localhost:9222' },
      useOg: false,
      editor: undefined,
    });
    expect(mockWarn).toHaveBeenCalledWith(CURL_DEPRECATION_WARNING);
  });

  test('does not call runValidate when safeRun does not execute callback', async () => {
    mockSafeRun.mockImplementation(async () => undefined);

    await validateCommand.handler({ url: URL, curl: false, fetcher: undefined, og: false, editor: undefined });

    expect(mockRunValidate).not.toHaveBeenCalled();
  });
});
