import { afterAll, beforeEach, describe, expect, mock, test } from 'bun:test';

const mockCommand = mock((config: unknown) => config);
const mockFlag = mock((config: unknown) => config);
const mockOption = mock((config: unknown) => config);
const mockOptional = mock((type: unknown) => ({ optional: type }));
const mockPositional = mock((config: unknown) => config);

const mockRunValidate = mock(async () => undefined);
const mockSafeRun = mock(async (fn: () => Promise<void>) => fn());
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
    mockSafeRun.mockImplementation(async (fn: () => Promise<void>) => fn());
    validateCommand = createValidateCommand({ runValidate: mockRunValidate, safeRun: mockSafeRun });
  });

  test('name is validate', () => {
    expect(validateCommand.name).toBe('validate');
  });

  test('calls runValidate with default flags', async () => {
    await validateCommand.handler({ url: URL, curl: false, og: false, editor: undefined });

    expect(mockRunValidate).toHaveBeenCalledWith(URL, { useCurl: false, useOg: false, editor: undefined });
  });

  test('passes editor command when provided', async () => {
    await validateCommand.handler({ url: URL, curl: false, og: false, editor: 'code' });

    expect(mockRunValidate).toHaveBeenCalledWith(URL, { useCurl: false, useOg: false, editor: 'code' });
  });

  test('passes all options through', async () => {
    await validateCommand.handler({ url: URL, curl: true, og: true, editor: 'cursor' });

    expect(mockRunValidate).toHaveBeenCalledWith(URL, { useCurl: true, useOg: true, editor: 'cursor' });
  });

  test('does not call runValidate when safeRun does not execute callback', async () => {
    mockSafeRun.mockImplementation(async () => undefined);

    await validateCommand.handler({ url: URL, curl: false, og: false, editor: undefined });

    expect(mockRunValidate).not.toHaveBeenCalled();
  });
});
