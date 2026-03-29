import { beforeEach, describe, expect, mock, test } from 'bun:test';

import { createValidateCommand } from './validate.command';

const mockRunValidate = mock(async () => undefined);

const mockSafeRun = mock(async (fn: () => Promise<void>) => fn());
let validateCommand: ReturnType<typeof createValidateCommand>;

// ── fixtures ───────────────────────────────────────────────────────────────────

const URL = 'https://example.com';

// ── suite ──────────────────────────────────────────────────────────────────────

describe('validateCommand', () => {
  beforeEach(() => {
    mockRunValidate.mockReset();
    mockSafeRun.mockImplementation(async (fn: () => Promise<void>) => fn());
    validateCommand = createValidateCommand({ runValidate: mockRunValidate, safeRun: mockSafeRun });
  });

  // ── metadata ─────────────────────────────────────────────────────────────────

  describe('metadata', () => {
    test('name is "validate"', () => {
      // Arrange — command is the module under test

      // Act — (none, reading static property)

      // Assert
      expect(validateCommand.name).toBe('validate');
    });

    test('description mentions single-URL validation', () => {
      // Arrange — command is the module under test

      // Act — (none, reading static property)

      // Assert
      expect(validateCommand.description).toContain('Validate');
    });
  });

  // ── handler ───────────────────────────────────────────────────────────────────

  describe('handler', () => {
    test('wraps execution in safeRun', async () => {
      // Arrange
      const args = { url: URL, curl: false, og: false };

      // Act
      await validateCommand.handler(args);

      // Assert
      expect(mockSafeRun).toHaveBeenCalledTimes(1);
    });

    test('calls runValidate with url and default flags', async () => {
      // Arrange
      const args = { url: URL, curl: false, og: false };

      // Act
      await validateCommand.handler(args);

      // Assert
      expect(mockRunValidate).toHaveBeenCalledTimes(1);
      expect(mockRunValidate).toHaveBeenCalledWith(URL, { useCurl: false, useOg: false });
    });

    test('passes useCurl: true when curl flag is set', async () => {
      // Arrange
      const args = { url: URL, curl: true, og: false };

      // Act
      await validateCommand.handler(args);

      // Assert
      expect(mockRunValidate).toHaveBeenCalledWith(URL, { useCurl: true, useOg: false });
    });

    test('passes useOg: true when og flag is set', async () => {
      // Arrange
      const args = { url: URL, curl: false, og: true };

      // Act
      await validateCommand.handler(args);

      // Assert
      expect(mockRunValidate).toHaveBeenCalledWith(URL, { useCurl: false, useOg: true });
    });

    test('passes both flags when curl and og are set', async () => {
      // Arrange
      const args = { url: URL, curl: true, og: true };

      // Act
      await validateCommand.handler(args);

      // Assert
      expect(mockRunValidate).toHaveBeenCalledWith(URL, { useCurl: true, useOg: true });
    });
  });
});
