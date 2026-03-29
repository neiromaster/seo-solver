import { afterAll, beforeEach, describe, expect, mock, test } from 'bun:test';

const mockCommand = mock((config: unknown) => config);
const mockFlag = mock((config: unknown) => config);
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

  describe('metadata', () => {
    test('name is "validate"', () => {
      expect(validateCommand.name).toBe('validate');
    });

    test('description mentions single-URL validation', () => {
      expect(validateCommand.description).toContain('Validate');
    });
  });

  describe('handler', () => {
    test('wraps execution in safeRun', async () => {
      const args = { url: URL, curl: false, og: false };

      await validateCommand.handler(args);

      expect(mockSafeRun).toHaveBeenCalledTimes(1);
    });

    test('calls runValidate with url and default flags', async () => {
      const args = { url: URL, curl: false, og: false };

      await validateCommand.handler(args);

      expect(mockRunValidate).toHaveBeenCalledTimes(1);
      expect(mockRunValidate).toHaveBeenCalledWith(URL, { useCurl: false, useOg: false });
    });

    test('passes useCurl: true when curl flag is set', async () => {
      const args = { url: URL, curl: true, og: false };

      await validateCommand.handler(args);

      expect(mockRunValidate).toHaveBeenCalledWith(URL, { useCurl: true, useOg: false });
    });

    test('passes useOg: true when og flag is set', async () => {
      const args = { url: URL, curl: false, og: true };

      await validateCommand.handler(args);

      expect(mockRunValidate).toHaveBeenCalledWith(URL, { useCurl: false, useOg: true });
    });

    test('passes both flags when curl and og are set', async () => {
      const args = { url: URL, curl: true, og: true };

      await validateCommand.handler(args);

      expect(mockRunValidate).toHaveBeenCalledWith(URL, { useCurl: true, useOg: true });
    });

    test('does not call runValidate when safeRun does not execute the callback', async () => {
      const args = { url: URL, curl: false, og: false };
      mockSafeRun.mockImplementation(async () => undefined);

      await validateCommand.handler(args);

      expect(mockSafeRun).toHaveBeenCalledTimes(1);
      expect(mockRunValidate).not.toHaveBeenCalled();
    });
  });
});
