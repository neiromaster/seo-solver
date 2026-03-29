import { afterAll, beforeEach, describe, expect, mock, test } from 'bun:test';

const mockCommand = mock((config: unknown) => config);
const mockFlag = mock((config: unknown) => config);
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

  describe('metadata', () => {
    test('name is "diff"', () => {
      expect(diffCommand.name).toBe('diff');
    });

    test('description mentions comparing two URLs', () => {
      expect(diffCommand.description).toContain('Compare');
    });
  });

  describe('handler', () => {
    test('wraps execution in safeRun', async () => {
      const args = { url1: URL1, url2: URL2, curl: false, og: false, vscode: false };

      await diffCommand.handler(args);

      expect(mockSafeRun).toHaveBeenCalledTimes(1);
    });

    test('calls runDiff with both urls and default flags', async () => {
      const args = { url1: URL1, url2: URL2, curl: false, og: false, vscode: false };

      await diffCommand.handler(args);

      expect(mockRunDiff).toHaveBeenCalledTimes(1);
      expect(mockRunDiff).toHaveBeenCalledWith(URL1, URL2, {
        useCurl: false,
        useOg: false,
        vscodeDiff: false,
      });
    });

    test('passes useCurl: true when curl flag is set', async () => {
      const args = { url1: URL1, url2: URL2, curl: true, og: false, vscode: false };

      await diffCommand.handler(args);

      expect(mockRunDiff).toHaveBeenCalledWith(URL1, URL2, {
        useCurl: true,
        useOg: false,
        vscodeDiff: false,
      });
    });

    test('passes useOg: true when og flag is set', async () => {
      const args = { url1: URL1, url2: URL2, curl: false, og: true, vscode: false };

      await diffCommand.handler(args);

      expect(mockRunDiff).toHaveBeenCalledWith(URL1, URL2, {
        useCurl: false,
        useOg: true,
        vscodeDiff: false,
      });
    });

    test('passes vscodeDiff: true when vscode flag is set', async () => {
      const args = { url1: URL1, url2: URL2, curl: false, og: false, vscode: true };

      await diffCommand.handler(args);

      expect(mockRunDiff).toHaveBeenCalledWith(URL1, URL2, {
        useCurl: false,
        useOg: false,
        vscodeDiff: true,
      });
    });

    test('passes all flags when all are set', async () => {
      const args = { url1: URL1, url2: URL2, curl: true, og: true, vscode: true };

      await diffCommand.handler(args);

      expect(mockRunDiff).toHaveBeenCalledWith(URL1, URL2, {
        useCurl: true,
        useOg: true,
        vscodeDiff: true,
      });
    });

    test('does not call runDiff when safeRun does not execute the callback', async () => {
      const args = { url1: URL1, url2: URL2, curl: false, og: false, vscode: false };
      mockSafeRun.mockImplementation(async () => undefined);

      await diffCommand.handler(args);

      expect(mockSafeRun).toHaveBeenCalledTimes(1);
      expect(mockRunDiff).not.toHaveBeenCalled();
    });
  });
});
