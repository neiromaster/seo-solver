import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test';
import type { OgData, Schema } from '#types';
import { type CreateRunValidateDeps, createRunValidate, type ValidateOptions } from './validate-runner';

const mockReadOg = mock(async () => ({}) as OgData);
const mockReadSchemas = mock(async () => [] as Schema[]);

const mockSchemaValidatorValidate = mock(async () => undefined);
let runValidate: (url: string, options: ValidateOptions) => Promise<void>;

// ── fixtures ──────────────────────────────────────────────────────────────────

const URL = 'https://example.com';
const OG_DATA: OgData = { 'og:title': 'Page' };
const SCHEMAS: Schema[] = [{ '@type': 'Article', name: 'Test' }];

function stripAnsi(value: string): string {
  return value
    .replaceAll('\u001B[36m', '')
    .replaceAll('\u001B[39m', '')
    .replaceAll('\u001B[1m', '')
    .replaceAll('\u001B[22m', '')
    .replaceAll('\u001B[33m', '');
}

// ── suite ─────────────────────────────────────────────────────────────────────

describe('runValidate', () => {
  let logSpy: ReturnType<typeof spyOn<typeof console, 'log'>>;

  beforeEach(() => {
    logSpy = spyOn(console, 'log').mockImplementation(() => {});

    mockReadOg.mockReset();
    mockReadSchemas.mockReset();
    mockSchemaValidatorValidate.mockReset();

    mockReadOg.mockResolvedValue(OG_DATA);
    mockReadSchemas.mockResolvedValue(SCHEMAS);
    mockSchemaValidatorValidate.mockResolvedValue(undefined);

    const deps: CreateRunValidateDeps = {
      metadataReader: {
        readOg: mockReadOg,
        readSchemas: mockReadSchemas,
      },
      schemaValidator: {
        validate: mockSchemaValidatorValidate,
      },
      log: console,
    };

    runValidate = createRunValidate(deps);
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  // ── URL normalisation ──────────────────────────────────────────────────────

  describe('URL normalisation', () => {
    test('passes URL unchanged when it already has https:// scheme', async () => {
      // Arrange
      const url = 'https://example.com';

      // Act
      await runValidate(url, { useCurl: true, useOg: true });

      // Assert
      expect(mockReadOg).toHaveBeenCalledWith('https://example.com', 'curl');
    });

    test('passes URL unchanged when it already has http:// scheme', async () => {
      // Arrange
      const url = 'http://example.com';

      // Act
      await runValidate(url, { useCurl: true, useOg: true });

      // Assert
      expect(mockReadOg).toHaveBeenCalledWith('http://example.com', 'curl');
    });

    test('prepends https:// when URL has no scheme', async () => {
      // Arrange
      const url = 'example.com';

      // Act
      await runValidate(url, { useCurl: true, useOg: true });

      // Assert
      expect(mockReadOg).toHaveBeenCalledWith('https://example.com', 'curl');
    });

    test('scheme check is case-insensitive', async () => {
      // Arrange
      const url = 'HTTPS://example.com';

      // Act
      await runValidate(url, { useCurl: true, useOg: true });

      // Assert — passed through unchanged because regex /^https?:\/\//i matched
      expect(mockReadOg).toHaveBeenCalledWith('HTTPS://example.com', 'curl');
    });
  });

  // ── curl + OG ──────────────────────────────────────────────────────────────

  describe('curl mode — OpenGraph', () => {
    test('fetches HTML and extracts OG data', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runValidate(URL, { useCurl: true, useOg: true });

      // Assert
      expect(mockReadOg).toHaveBeenCalledTimes(1);
      expect(mockReadSchemas).not.toHaveBeenCalled();
    });

    test('logs "OpenGraph validation not supported" instead of running validator', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runValidate(URL, { useCurl: true, useOg: true });

      // Assert
      expect(mockSchemaValidatorValidate).not.toHaveBeenCalled();
      const allOutput = logSpy.mock.calls.map((c) => String(c[0])).join('\n');
      expect(allOutput).toContain('not supported');
    });

    test('logs mode banner and normalized URL summary', async () => {
      // Arrange
      const url = 'example.com';

      // Act
      await runValidate(url, { useCurl: true, useOg: true });

      // Assert
      const output = stripAnsi(logSpy.mock.calls.map((args) => String(args[0] ?? '')).join('\n'));
      expect(output).toContain('Validating OpenGraph (curl/SSR)');
      expect(output).toContain('URL: https://example.com → 1 tag(s)');
    });
  });

  // ── curl + JSON-LD ─────────────────────────────────────────────────────────

  describe('curl mode — JSON-LD', () => {
    test('fetches HTML and extracts schemas', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runValidate(URL, { useCurl: true, useOg: false });

      // Assert
      expect(mockReadSchemas).toHaveBeenCalledTimes(1);
      expect(mockReadOg).not.toHaveBeenCalled();
    });

    test('calls validateSchemas with extracted schemas', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runValidate(URL, { useCurl: true, useOg: false });

      // Assert
      expect(mockSchemaValidatorValidate).toHaveBeenCalledTimes(1);
      expect(mockSchemaValidatorValidate).toHaveBeenCalledWith(SCHEMAS);
    });
  });

  // ── browser + OG ──────────────────────────────────────────────────────────

  describe('browser mode — OpenGraph', () => {
    test('launches browser and extracts OG data', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runValidate(URL, { useCurl: false, useOg: true });

      // Assert
      expect(mockReadOg).toHaveBeenCalledTimes(1);
      expect(mockReadOg).toHaveBeenCalledWith(URL, 'browser');
      expect(mockReadSchemas).not.toHaveBeenCalled();
    });

    test('does not validate schemas for OG mode', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runValidate(URL, { useCurl: false, useOg: true });

      // Assert
      expect(mockSchemaValidatorValidate).not.toHaveBeenCalled();
    });

    test('propagates metadataReader OG failures', async () => {
      // Arrange
      mockReadOg.mockRejectedValue(new Error('page load failed'));

      await expect(runValidate(URL, { useCurl: false, useOg: true })).rejects.toThrow('page load failed');
    });

    test('does not fetch SSR HTML in browser mode', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runValidate(URL, { useCurl: false, useOg: true });

      // Assert
      expect(mockReadSchemas).not.toHaveBeenCalled();
    });
  });

  // ── browser + JSON-LD ─────────────────────────────────────────────────────

  describe('browser mode — JSON-LD', () => {
    test('launches browser and extracts schemas', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runValidate(URL, { useCurl: false, useOg: false });

      // Assert
      expect(mockReadSchemas).toHaveBeenCalledTimes(1);
      expect(mockReadOg).not.toHaveBeenCalled();
    });

    test('calls validateSchemas with browser-extracted schemas', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runValidate(URL, { useCurl: false, useOg: false });

      // Assert
      expect(mockSchemaValidatorValidate).toHaveBeenCalledTimes(1);
    });

    test('propagates metadataReader schema failures', async () => {
      // Arrange
      mockReadSchemas.mockRejectedValue(new Error('navigation failed'));

      await expect(runValidate(URL, { useCurl: false, useOg: false })).rejects.toThrow('navigation failed');
    });
  });
});
