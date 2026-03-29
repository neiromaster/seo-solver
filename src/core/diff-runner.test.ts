import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test';
import { type Browser, chromium } from 'playwright';
import type { OgData, Schema } from '#types';
import {
  runDiff as actualRunDiff,
  type DiffOptions,
  type DiffRunnerDeps,
  launchDefaultDiffBrowser,
} from './diff-runner';

const mockFetchHtmlCurl = mock(() => '<html/>');

const mockExtractOgBrowser = mock(async () => ({}) as OgData);
const mockExtractSchemasBrowser = mock(async () => [] as Schema[]);

const mockExtractOgFromHtml = mock((): OgData => ({}));
const mockExtractSchemasFromHtml = mock((): Schema[] => []);

const mockCompareOg = mock(() => {});
const mockCompareJsonLd = mock(() => {});

const mockFormatSchemasForDiff = mock((): string => '[]');
const mockOpenVscodeDiff = mock(() => {});

const mockBrowserClose = mock(async () => undefined);
const mockBrowser = { close: mockBrowserClose } as unknown as Browser;
const mockChromiumLaunch = mock(async () => mockBrowser);
let runDiff: (url1: string, url2: string, options: DiffOptions) => Promise<void>;

// ── fixtures ──────────────────────────────────────────────────────────────────

const URL1 = 'https://example.com';
const URL2 = 'https://other.com';
const OG_DATA: OgData = { 'og:title': 'Page One' };
const SCHEMAS: Schema[] = [{ '@type': 'Article', name: 'Test' }];

// ── suite ─────────────────────────────────────────────────────────────────────

describe('runDiff', () => {
  let logSpy: ReturnType<typeof spyOn<typeof console, 'log'>>;

  beforeEach(() => {
    logSpy = spyOn(console, 'log').mockImplementation(() => {});

    // Reset all mocks and restore sensible defaults
    mockFetchHtmlCurl.mockReset();
    mockExtractOgBrowser.mockReset();
    mockExtractSchemasBrowser.mockReset();
    mockExtractOgFromHtml.mockReset();
    mockExtractSchemasFromHtml.mockReset();
    mockCompareOg.mockReset();
    mockCompareJsonLd.mockReset();
    mockFormatSchemasForDiff.mockReset();
    mockOpenVscodeDiff.mockReset();
    mockBrowserClose.mockReset();
    mockChromiumLaunch.mockReset();

    mockFetchHtmlCurl.mockReturnValue('<html/>');
    mockExtractOgFromHtml.mockReturnValue(OG_DATA);
    mockExtractSchemasFromHtml.mockReturnValue(SCHEMAS);
    mockExtractOgBrowser.mockResolvedValue(OG_DATA);
    mockExtractSchemasBrowser.mockResolvedValue(SCHEMAS);
    mockFormatSchemasForDiff.mockReturnValue('[{"@type":"Article"}]');
    mockBrowserClose.mockResolvedValue(undefined);
    mockChromiumLaunch.mockResolvedValue(mockBrowser);

    const deps: DiffRunnerDeps = {
      fetchHtmlCurl: mockFetchHtmlCurl,
      extractOgBrowser: mockExtractOgBrowser,
      extractSchemasBrowser: mockExtractSchemasBrowser,
      extractOgFromHtml: mockExtractOgFromHtml,
      extractSchemasFromHtml: mockExtractSchemasFromHtml,
      compareOg: mockCompareOg,
      compareJsonLd: mockCompareJsonLd,
      formatSchemasForDiff: mockFormatSchemasForDiff,
      openVscodeDiff: mockOpenVscodeDiff,
      launchBrowser: mockChromiumLaunch,
    };

    runDiff = (url1, url2, options) => actualRunDiff(url1, url2, options, deps);
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
      expect(mockFetchHtmlCurl).toHaveBeenCalledTimes(2);
      expect(mockFetchHtmlCurl).toHaveBeenNthCalledWith(1, URL1);
      expect(mockFetchHtmlCurl).toHaveBeenNthCalledWith(2, URL2);
    });

    test('extracts OG data from both HTML responses', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runDiff(URL1, URL2, { useCurl: true, useOg: true, vscodeDiff: false });

      // Assert
      expect(mockExtractOgFromHtml).toHaveBeenCalledTimes(2);
      expect(mockExtractSchemasFromHtml).not.toHaveBeenCalled();
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
      expect(mockOpenVscodeDiff).not.toHaveBeenCalled();
    });
  });

  // ── curl + JSON-LD ─────────────────────────────────────────────────────────

  describe('curl mode — JSON-LD', () => {
    test('extracts schemas from both HTML responses', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runDiff(URL1, URL2, { useCurl: true, useOg: false, vscodeDiff: false });

      // Assert
      expect(mockExtractSchemasFromHtml).toHaveBeenCalledTimes(2);
      expect(mockExtractOgFromHtml).not.toHaveBeenCalled();
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
      expect(mockChromiumLaunch).toHaveBeenCalledTimes(1);
      expect(mockExtractOgBrowser).toHaveBeenCalledTimes(2);
    });

    test('calls compareOg with browser-extracted data', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runDiff(URL1, URL2, { useCurl: false, useOg: true, vscodeDiff: false });

      // Assert
      expect(mockCompareOg).toHaveBeenCalledTimes(1);
    });

    test('closes browser after successful extraction', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runDiff(URL1, URL2, { useCurl: false, useOg: true, vscodeDiff: false });

      // Assert
      expect(mockBrowserClose).toHaveBeenCalledTimes(1);
    });

    test('closes browser even when extraction throws', async () => {
      // Arrange
      mockExtractOgBrowser.mockRejectedValue(new Error('navigation failed'));

      // Act
      await runDiff(URL1, URL2, { useCurl: false, useOg: true, vscodeDiff: false }).catch(() => {});

      // Assert
      expect(mockBrowserClose).toHaveBeenCalledTimes(1);
    });
  });

  // ── browser + JSON-LD ─────────────────────────────────────────────────────

  describe('browser mode — JSON-LD', () => {
    test('launches browser and extracts schemas from both URLs', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runDiff(URL1, URL2, { useCurl: false, useOg: false, vscodeDiff: false });

      // Assert
      expect(mockExtractSchemasBrowser).toHaveBeenCalledTimes(2);
      expect(mockCompareJsonLd).toHaveBeenCalledTimes(1);
    });

    test('closes browser after successful extraction', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runDiff(URL1, URL2, { useCurl: false, useOg: false, vscodeDiff: false });

      // Assert
      expect(mockBrowserClose).toHaveBeenCalledTimes(1);
    });
  });

  // ── vscodeDiff ────────────────────────────────────────────────────────────

  describe('vscodeDiff — OpenGraph', () => {
    test('calls openVscodeDiff with "og" prefix and JSON-serialised data', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runDiff(URL1, URL2, { useCurl: true, useOg: true, vscodeDiff: true });

      // Assert
      expect(mockOpenVscodeDiff).toHaveBeenCalledTimes(1);
      expect(mockOpenVscodeDiff).toHaveBeenCalledWith(expect.any(String), expect.any(String), 'og', URL1, URL2);
    });

    test('does not call formatSchemasForDiff for OG diff', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runDiff(URL1, URL2, { useCurl: true, useOg: true, vscodeDiff: true });

      // Assert
      expect(mockFormatSchemasForDiff).not.toHaveBeenCalled();
    });
  });

  describe('vscodeDiff — JSON-LD', () => {
    test('calls formatSchemasForDiff for both schema sets', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runDiff(URL1, URL2, { useCurl: true, useOg: false, vscodeDiff: true });

      // Assert
      expect(mockFormatSchemasForDiff).toHaveBeenCalledTimes(2);
    });

    test('calls openVscodeDiff with "schema" prefix', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runDiff(URL1, URL2, { useCurl: true, useOg: false, vscodeDiff: true });

      // Assert
      expect(mockOpenVscodeDiff).toHaveBeenCalledTimes(1);
      expect(mockOpenVscodeDiff).toHaveBeenCalledWith(expect.any(String), expect.any(String), 'schema', URL1, URL2);
    });
  });
});

describe('launchDefaultDiffBrowser', () => {
  test('delegates to chromium.launch', async () => {
    // Arrange
    const browser = {} as Browser;
    const launchSpy = spyOn(chromium, 'launch').mockResolvedValue(browser);

    try {
      // Act
      const result = await launchDefaultDiffBrowser();

      // Assert
      expect(result).toBe(browser);
      expect(launchSpy).toHaveBeenCalledTimes(1);
    } finally {
      launchSpy.mockRestore();
    }
  });
});
