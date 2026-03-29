import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test';
import type { OgData, Schema } from '#types';
import { type CreateRunDiffDeps, createRunDiff, type DiffOptions } from './diff-runner';

const mockReadOg = mock(async () => ({}) as OgData);
const mockReadSchemas = mock(async () => [] as Schema[]);

const mockCompareOg = mock(() => {});
const mockCompareJsonLd = mock(() => {});

const mockOpenOgDiff = mock(() => undefined);
const mockOpenSchemasDiff = mock(() => undefined);
let runDiff: (url1: string, url2: string, options: DiffOptions) => Promise<void>;

// ── fixtures ──────────────────────────────────────────────────────────────────

const URL1 = 'https://example.com';
const URL2 = 'https://other.com';
const OG_DATA: OgData = { 'og:title': 'Page One' };
const SCHEMAS: Schema[] = [{ '@type': 'Article', name: 'Test' }];

function stripAnsi(value: string): string {
  return value
    .replaceAll('\u001B[36m', '')
    .replaceAll('\u001B[39m', '')
    .replaceAll('\u001B[1m', '')
    .replaceAll('\u001B[22m', '');
}

// ── suite ─────────────────────────────────────────────────────────────────────

describe('runDiff', () => {
  let logSpy: ReturnType<typeof spyOn<typeof console, 'log'>>;

  beforeEach(() => {
    logSpy = spyOn(console, 'log').mockImplementation(() => {});

    // Reset all mocks and restore sensible defaults
    mockReadOg.mockReset();
    mockReadSchemas.mockReset();
    mockCompareOg.mockReset();
    mockCompareJsonLd.mockReset();
    mockOpenOgDiff.mockReset();
    mockOpenSchemasDiff.mockReset();

    mockReadOg.mockResolvedValue(OG_DATA);
    mockReadSchemas.mockResolvedValue(SCHEMAS);

    const deps: CreateRunDiffDeps = {
      metadataReader: {
        readOg: mockReadOg,
        readSchemas: mockReadSchemas,
      },
      diffViewer: {
        openOgDiff: mockOpenOgDiff,
        openSchemasDiff: mockOpenSchemasDiff,
      },
      log: console,
      compareOg: mockCompareOg,
      compareJsonLd: mockCompareJsonLd,
    };

    runDiff = createRunDiff(deps);
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  // ── curl + OG ──────────────────────────────────────────────────────────────

  describe('curl mode — OpenGraph', () => {
    test('fetches HTML for both URLs', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runDiff(URL1, URL2, { useCurl: true, useOg: true, vscodeDiff: false });

      // Assert
      expect(mockReadOg).toHaveBeenCalledTimes(2);
      expect(mockReadOg).toHaveBeenNthCalledWith(1, URL1, 'curl');
      expect(mockReadOg).toHaveBeenNthCalledWith(2, URL2, 'curl');
    });

    test('extracts OG data from both HTML responses', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runDiff(URL1, URL2, { useCurl: true, useOg: true, vscodeDiff: false });

      // Assert
      expect(mockReadOg).toHaveBeenCalledTimes(2);
      expect(mockReadSchemas).not.toHaveBeenCalled();
    });

    test('calls compareOg with the extracted data', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runDiff(URL1, URL2, { useCurl: true, useOg: true, vscodeDiff: false });

      // Assert
      expect(mockCompareOg).toHaveBeenCalledTimes(1);
      expect(mockCompareJsonLd).not.toHaveBeenCalled();
    });

    test('does not open vscode diff when vscodeDiff is false', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runDiff(URL1, URL2, { useCurl: true, useOg: true, vscodeDiff: false });

      // Assert
      expect(mockOpenOgDiff).not.toHaveBeenCalled();
    });

    test('logs mode banner and per-url tag counts', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runDiff(URL1, URL2, { useCurl: true, useOg: true, vscodeDiff: false });

      // Assert
      const output = stripAnsi(logSpy.mock.calls.map((args) => String(args[0] ?? '')).join('\n'));
      expect(output).toContain('Fetching OpenGraph metadata (curl/SSR)');
      expect(output).toContain(`URL1: ${URL1} → 1 tag(s)`);
      expect(output).toContain(`URL2: ${URL2} → 1 tag(s)`);
    });
  });

  // ── curl + JSON-LD ─────────────────────────────────────────────────────────

  describe('curl mode — JSON-LD', () => {
    test('extracts schemas from both HTML responses', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runDiff(URL1, URL2, { useCurl: true, useOg: false, vscodeDiff: false });

      // Assert
      expect(mockReadSchemas).toHaveBeenCalledTimes(2);
      expect(mockReadOg).not.toHaveBeenCalled();
    });

    test('calls compareJsonLd with extracted schemas', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runDiff(URL1, URL2, { useCurl: true, useOg: false, vscodeDiff: false });

      // Assert
      expect(mockCompareJsonLd).toHaveBeenCalledTimes(1);
      expect(mockCompareOg).not.toHaveBeenCalled();
    });
  });

  // ── browser + OG ──────────────────────────────────────────────────────────

  describe('browser mode — OpenGraph', () => {
    test('launches browser and extracts OG data from both URLs', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runDiff(URL1, URL2, { useCurl: false, useOg: true, vscodeDiff: false });

      // Assert
      expect(mockReadOg).toHaveBeenCalledTimes(2);
      expect(mockReadOg).toHaveBeenNthCalledWith(1, URL1, 'browser');
      expect(mockReadOg).toHaveBeenNthCalledWith(2, URL2, 'browser');
    });

    test('calls compareOg with browser-extracted data', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runDiff(URL1, URL2, { useCurl: false, useOg: true, vscodeDiff: false });

      // Assert
      expect(mockCompareOg).toHaveBeenCalledTimes(1);
    });

    test('propagates readOg failures from metadataReader', async () => {
      // Arrange
      mockReadOg.mockRejectedValue(new Error('navigation failed'));

      await expect(runDiff(URL1, URL2, { useCurl: false, useOg: true, vscodeDiff: false })).rejects.toThrow(
        'navigation failed',
      );
    });

    test('does not fetch SSR HTML in browser mode', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runDiff(URL1, URL2, { useCurl: false, useOg: true, vscodeDiff: false });

      // Assert
      expect(mockReadSchemas).not.toHaveBeenCalled();
    });
  });

  // ── browser + JSON-LD ─────────────────────────────────────────────────────

  describe('browser mode — JSON-LD', () => {
    test('launches browser and extracts schemas from both URLs', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runDiff(URL1, URL2, { useCurl: false, useOg: false, vscodeDiff: false });

      // Assert
      expect(mockReadSchemas).toHaveBeenCalledTimes(2);
      expect(mockCompareJsonLd).toHaveBeenCalledTimes(1);
    });

    test('propagates readSchemas failures from metadataReader', async () => {
      mockReadSchemas.mockRejectedValue(new Error('schema read failed'));

      await expect(runDiff(URL1, URL2, { useCurl: false, useOg: false, vscodeDiff: false })).rejects.toThrow(
        'schema read failed',
      );
    });
  });

  // ── vscodeDiff ────────────────────────────────────────────────────────────

  describe('vscodeDiff — OpenGraph', () => {
    test('calls openVscodeDiff with "og" prefix and JSON-serialised data', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runDiff(URL1, URL2, { useCurl: true, useOg: true, vscodeDiff: true });

      // Assert
      expect(mockOpenOgDiff).toHaveBeenCalledTimes(1);
      expect(mockOpenOgDiff).toHaveBeenCalledWith(OG_DATA, OG_DATA, { url1: URL1, url2: URL2 });
    });
  });

  describe('vscodeDiff — JSON-LD', () => {
    test('calls formatSchemasForDiff for both schema sets', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runDiff(URL1, URL2, { useCurl: true, useOg: false, vscodeDiff: true });

      // Assert
      expect(mockOpenSchemasDiff).toHaveBeenCalledTimes(1);
      expect(mockOpenSchemasDiff).toHaveBeenCalledWith(SCHEMAS, SCHEMAS, { url1: URL1, url2: URL2 });
    });
  });
});
