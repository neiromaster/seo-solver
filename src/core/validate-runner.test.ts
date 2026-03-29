import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test';
import { type Browser, chromium } from 'playwright';
import type { OgData, Schema } from '#types';
import {
  runValidate as actualRunValidate,
  launchDefaultValidateBrowser,
  type ValidateOptions,
  type ValidateRunnerDeps,
} from './validate-runner';

const mockFetchHtmlCurl = mock(() => '<html/>');

const mockExtractOgBrowser = mock(async () => ({}) as OgData);
const mockExtractSchemasBrowser = mock(async () => [] as Schema[]);

const mockExtractOgFromHtml = mock((): OgData => ({}));
const mockExtractSchemasFromHtml = mock((): Schema[] => []);

const mockValidateSchemas = mock(async () => undefined);

const mockBrowserClose = mock(async () => undefined);
const mockBrowser = { close: mockBrowserClose } as unknown as Browser;
const mockChromiumLaunch = mock(async () => mockBrowser);
let runValidate: (url: string, options: ValidateOptions) => Promise<void>;

// ── fixtures ──────────────────────────────────────────────────────────────────

const URL = 'https://example.com';
const OG_DATA: OgData = { 'og:title': 'Page' };
const SCHEMAS: Schema[] = [{ '@type': 'Article', name: 'Test' }];

// ── suite ─────────────────────────────────────────────────────────────────────

describe('runValidate', () => {
  let logSpy: ReturnType<typeof spyOn<typeof console, 'log'>>;

  beforeEach(() => {
    logSpy = spyOn(console, 'log').mockImplementation(() => {});

    mockFetchHtmlCurl.mockReset();
    mockExtractOgBrowser.mockReset();
    mockExtractSchemasBrowser.mockReset();
    mockExtractOgFromHtml.mockReset();
    mockExtractSchemasFromHtml.mockReset();
    mockValidateSchemas.mockReset();
    mockBrowserClose.mockReset();
    mockChromiumLaunch.mockReset();

    mockFetchHtmlCurl.mockReturnValue('<html/>');
    mockExtractOgFromHtml.mockReturnValue(OG_DATA);
    mockExtractSchemasFromHtml.mockReturnValue(SCHEMAS);
    mockExtractOgBrowser.mockResolvedValue(OG_DATA);
    mockExtractSchemasBrowser.mockResolvedValue(SCHEMAS);
    mockValidateSchemas.mockResolvedValue(undefined);
    mockBrowserClose.mockResolvedValue(undefined);
    mockChromiumLaunch.mockResolvedValue(mockBrowser);

    const deps: ValidateRunnerDeps = {
      fetchHtmlCurl: mockFetchHtmlCurl,
      extractOgBrowser: mockExtractOgBrowser,
      extractSchemasBrowser: mockExtractSchemasBrowser,
      extractOgFromHtml: mockExtractOgFromHtml,
      extractSchemasFromHtml: mockExtractSchemasFromHtml,
      validateSchemas: mockValidateSchemas,
      launchBrowser: mockChromiumLaunch,
    };

    runValidate = (url, options) => actualRunValidate(url, options, deps);
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
      expect(mockFetchHtmlCurl).toHaveBeenCalledWith('https://example.com');
    });

    test('passes URL unchanged when it already has http:// scheme', async () => {
      // Arrange
      const url = 'http://example.com';

      // Act
      await runValidate(url, { useCurl: true, useOg: true });

      // Assert
      expect(mockFetchHtmlCurl).toHaveBeenCalledWith('http://example.com');
    });

    test('prepends https:// when URL has no scheme', async () => {
      // Arrange
      const url = 'example.com';

      // Act
      await runValidate(url, { useCurl: true, useOg: true });

      // Assert
      expect(mockFetchHtmlCurl).toHaveBeenCalledWith('https://example.com');
    });

    test('scheme check is case-insensitive', async () => {
      // Arrange
      const url = 'HTTPS://example.com';

      // Act
      await runValidate(url, { useCurl: true, useOg: true });

      // Assert — passed through unchanged because regex /^https?:\/\//i matched
      expect(mockFetchHtmlCurl).toHaveBeenCalledWith('HTTPS://example.com');
    });
  });

  // ── curl + OG ──────────────────────────────────────────────────────────────

  describe('curl mode — OpenGraph', () => {
    test('fetches HTML and extracts OG data', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runValidate(URL, { useCurl: true, useOg: true });

      // Assert
      expect(mockFetchHtmlCurl).toHaveBeenCalledTimes(1);
      expect(mockExtractOgFromHtml).toHaveBeenCalledTimes(1);
      expect(mockExtractSchemasFromHtml).not.toHaveBeenCalled();
    });

    test('logs "OpenGraph validation not supported" instead of running validator', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runValidate(URL, { useCurl: true, useOg: true });

      // Assert
      expect(mockValidateSchemas).not.toHaveBeenCalled();
      const allOutput = logSpy.mock.calls.map((c) => String(c[0])).join('\n');
      expect(allOutput).toContain('not supported');
    });
  });

  // ── curl + JSON-LD ─────────────────────────────────────────────────────────

  describe('curl mode — JSON-LD', () => {
    test('fetches HTML and extracts schemas', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runValidate(URL, { useCurl: true, useOg: false });

      // Assert
      expect(mockFetchHtmlCurl).toHaveBeenCalledTimes(1);
      expect(mockExtractSchemasFromHtml).toHaveBeenCalledTimes(1);
      expect(mockExtractOgFromHtml).not.toHaveBeenCalled();
    });

    test('calls validateSchemas with extracted schemas', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runValidate(URL, { useCurl: true, useOg: false });

      // Assert
      expect(mockValidateSchemas).toHaveBeenCalledTimes(1);
      expect(mockValidateSchemas).toHaveBeenCalledWith(SCHEMAS);
    });
  });

  // ── browser + OG ──────────────────────────────────────────────────────────

  describe('browser mode — OpenGraph', () => {
    test('launches browser and extracts OG data', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runValidate(URL, { useCurl: false, useOg: true });

      // Assert
      expect(mockChromiumLaunch).toHaveBeenCalledTimes(1);
      expect(mockExtractOgBrowser).toHaveBeenCalledTimes(1);
      expect(mockExtractSchemasBrowser).not.toHaveBeenCalled();
    });

    test('does not validate schemas for OG mode', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runValidate(URL, { useCurl: false, useOg: true });

      // Assert
      expect(mockValidateSchemas).not.toHaveBeenCalled();
    });

    test('closes browser after successful extraction', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runValidate(URL, { useCurl: false, useOg: true });

      // Assert
      expect(mockBrowserClose).toHaveBeenCalledTimes(1);
    });

    test('closes browser even when extraction throws', async () => {
      // Arrange
      mockExtractOgBrowser.mockRejectedValue(new Error('page load failed'));

      // Act
      await runValidate(URL, { useCurl: false, useOg: true }).catch(() => {});

      // Assert
      expect(mockBrowserClose).toHaveBeenCalledTimes(1);
    });
  });

  // ── browser + JSON-LD ─────────────────────────────────────────────────────

  describe('browser mode — JSON-LD', () => {
    test('launches browser and extracts schemas', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runValidate(URL, { useCurl: false, useOg: false });

      // Assert
      expect(mockExtractSchemasBrowser).toHaveBeenCalledTimes(1);
      expect(mockExtractOgBrowser).not.toHaveBeenCalled();
    });

    test('calls validateSchemas with browser-extracted schemas', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runValidate(URL, { useCurl: false, useOg: false });

      // Assert
      expect(mockValidateSchemas).toHaveBeenCalledTimes(1);
    });

    test('closes browser after successful extraction', async () => {
      // Arrange — defaults in beforeEach

      // Act
      await runValidate(URL, { useCurl: false, useOg: false });

      // Assert
      expect(mockBrowserClose).toHaveBeenCalledTimes(1);
    });

    test('closes browser even when extraction throws', async () => {
      // Arrange
      mockExtractSchemasBrowser.mockRejectedValue(new Error('navigation failed'));

      // Act
      await runValidate(URL, { useCurl: false, useOg: false }).catch(() => {});

      // Assert
      expect(mockBrowserClose).toHaveBeenCalledTimes(1);
    });
  });
});

describe('launchDefaultValidateBrowser', () => {
  test('delegates to chromium.launch', async () => {
    // Arrange
    const browser = {} as Browser;
    const launchSpy = spyOn(chromium, 'launch').mockResolvedValue(browser);

    try {
      // Act
      const result = await launchDefaultValidateBrowser();

      // Assert
      expect(result).toBe(browser);
      expect(launchSpy).toHaveBeenCalledTimes(1);
    } finally {
      launchSpy.mockRestore();
    }
  });
});
