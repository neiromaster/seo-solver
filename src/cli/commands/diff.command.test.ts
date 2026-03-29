import { beforeEach, describe, expect, mock, test } from 'bun:test';

import { createDiffCommand } from './diff.command';

const mockRunDiff = mock(async () => undefined);

const mockSafeRun = mock(async (fn: () => Promise<void>) => fn());
let diffCommand: ReturnType<typeof createDiffCommand>;

// ── fixtures ───────────────────────────────────────────────────────────────────

const URL1 = 'https://example.com';
const URL2 = 'https://other.com';

// ── suite ──────────────────────────────────────────────────────────────────────

describe('diffCommand', () => {
  beforeEach(() => {
    mockRunDiff.mockReset();
    mockSafeRun.mockImplementation(async (fn: () => Promise<void>) => fn());
    diffCommand = createDiffCommand({ runDiff: mockRunDiff, safeRun: mockSafeRun });
  });

  // ── metadata ─────────────────────────────────────────────────────────────────

  describe('metadata', () => {
    test('name is "diff"', () => {
      // Arrange — command is the module under test

      // Act — (none, reading static property)

      // Assert
      expect(diffCommand.name).toBe('diff');
    });

    test('description mentions comparing two URLs', () => {
      // Arrange — command is the module under test

      // Act — (none, reading static property)

      // Assert
      expect(diffCommand.description).toContain('Compare');
    });
  });

  // ── handler ───────────────────────────────────────────────────────────────────

  describe('handler', () => {
    test('wraps execution in safeRun', async () => {
      // Arrange
      const args = { url1: URL1, url2: URL2, curl: false, og: false, vscode: false };

      // Act
      await diffCommand.handler(args);

      // Assert
      expect(mockSafeRun).toHaveBeenCalledTimes(1);
    });

    test('calls runDiff with both urls and default flags', async () => {
      // Arrange
      const args = { url1: URL1, url2: URL2, curl: false, og: false, vscode: false };

      // Act
      await diffCommand.handler(args);

      // Assert
      expect(mockRunDiff).toHaveBeenCalledTimes(1);
      expect(mockRunDiff).toHaveBeenCalledWith(URL1, URL2, {
        useCurl: false,
        useOg: false,
        vscodeDiff: false,
      });
    });

    test('passes useCurl: true when curl flag is set', async () => {
      // Arrange
      const args = { url1: URL1, url2: URL2, curl: true, og: false, vscode: false };

      // Act
      await diffCommand.handler(args);

      // Assert
      expect(mockRunDiff).toHaveBeenCalledWith(URL1, URL2, {
        useCurl: true,
        useOg: false,
        vscodeDiff: false,
      });
    });

    test('passes useOg: true when og flag is set', async () => {
      // Arrange
      const args = { url1: URL1, url2: URL2, curl: false, og: true, vscode: false };

      // Act
      await diffCommand.handler(args);

      // Assert
      expect(mockRunDiff).toHaveBeenCalledWith(URL1, URL2, {
        useCurl: false,
        useOg: true,
        vscodeDiff: false,
      });
    });

    test('passes vscodeDiff: true when vscode flag is set', async () => {
      // Arrange
      const args = { url1: URL1, url2: URL2, curl: false, og: false, vscode: true };

      // Act
      await diffCommand.handler(args);

      // Assert
      expect(mockRunDiff).toHaveBeenCalledWith(URL1, URL2, {
        useCurl: false,
        useOg: false,
        vscodeDiff: true,
      });
    });

    test('passes all flags when all are set', async () => {
      // Arrange
      const args = { url1: URL1, url2: URL2, curl: true, og: true, vscode: true };

      // Act
      await diffCommand.handler(args);

      // Assert
      expect(mockRunDiff).toHaveBeenCalledWith(URL1, URL2, {
        useCurl: true,
        useOg: true,
        vscodeDiff: true,
      });
    });
  });
});
