import { beforeEach, describe, expect, mock, spyOn, test } from 'bun:test';
import { type Browser, chromium } from 'playwright';
import type { OgData, Schema } from '#types';
import { createMetadataReader, launchDefaultMetadataBrowser } from './metadata-reader';

const mockFetchHtmlCurl = mock(async () => '<html/>');
const mockExtractOgFromHtml = mock(() => ({ 'og:title': 'Page' }) as OgData);
const mockExtractSchemasFromHtml = mock(() => [{ '@type': 'Article', name: 'Test' }] as Schema[]);
const mockExtractOgBrowser = mock(async () => ({ 'og:title': 'Browser Page' }) as OgData);
const mockExtractSchemasBrowser = mock(async () => [{ '@type': 'Product', name: 'Browser Test' }] as Schema[]);
const mockBrowserClose = mock(async () => undefined);
const mockBrowser = { close: mockBrowserClose } as unknown as Browser;
const mockLaunchBrowser = mock(async () => mockBrowser);

describe('createMetadataReader', () => {
  beforeEach(() => {
    mockFetchHtmlCurl.mockReset();
    mockExtractOgFromHtml.mockReset();
    mockExtractSchemasFromHtml.mockReset();
    mockExtractOgBrowser.mockReset();
    mockExtractSchemasBrowser.mockReset();
    mockBrowserClose.mockReset();
    mockLaunchBrowser.mockReset();

    mockFetchHtmlCurl.mockResolvedValue('<html/>');
    mockExtractOgFromHtml.mockReturnValue({ 'og:title': 'Page' });
    mockExtractSchemasFromHtml.mockReturnValue([{ '@type': 'Article', name: 'Test' }]);
    mockExtractOgBrowser.mockResolvedValue({ 'og:title': 'Browser Page' });
    mockExtractSchemasBrowser.mockResolvedValue([{ '@type': 'Product', name: 'Browser Test' }]);
    mockBrowserClose.mockResolvedValue(undefined);
    mockLaunchBrowser.mockResolvedValue(mockBrowser);
  });

  test('reads OG via curl without launching a browser', async () => {
    const reader = createMetadataReader({
      fetchHtmlCurl: mockFetchHtmlCurl,
      launchBrowser: mockLaunchBrowser,
      extractOgBrowser: mockExtractOgBrowser,
      extractSchemasBrowser: mockExtractSchemasBrowser,
      extractOgFromHtml: mockExtractOgFromHtml,
      extractSchemasFromHtml: mockExtractSchemasFromHtml,
    });

    const result = await reader.readOg('https://example.com', 'curl');

    expect(result).toEqual({ 'og:title': 'Page' });
    expect(mockFetchHtmlCurl).toHaveBeenCalledWith('https://example.com');
    expect(mockExtractOgFromHtml).toHaveBeenCalledWith('<html/>', 'https://example.com');
    expect(mockLaunchBrowser).not.toHaveBeenCalled();
  });

  test('reads schemas via browser and closes browser on success', async () => {
    const reader = createMetadataReader({
      fetchHtmlCurl: mockFetchHtmlCurl,
      launchBrowser: mockLaunchBrowser,
      extractOgBrowser: mockExtractOgBrowser,
      extractSchemasBrowser: mockExtractSchemasBrowser,
      extractOgFromHtml: mockExtractOgFromHtml,
      extractSchemasFromHtml: mockExtractSchemasFromHtml,
    });

    const result = await reader.readSchemas('https://example.com', 'browser');

    expect(result).toEqual([{ '@type': 'Product', name: 'Browser Test' }]);
    expect(mockLaunchBrowser).toHaveBeenCalledTimes(1);
    expect(mockExtractSchemasBrowser).toHaveBeenCalledWith(mockBrowser, 'https://example.com');
    expect(mockBrowserClose).toHaveBeenCalledTimes(1);
    expect(mockFetchHtmlCurl).not.toHaveBeenCalled();
  });

  test('reads OG via browser and closes browser on success', async () => {
    const reader = createMetadataReader({
      fetchHtmlCurl: mockFetchHtmlCurl,
      launchBrowser: mockLaunchBrowser,
      extractOgBrowser: mockExtractOgBrowser,
      extractSchemasBrowser: mockExtractSchemasBrowser,
      extractOgFromHtml: mockExtractOgFromHtml,
      extractSchemasFromHtml: mockExtractSchemasFromHtml,
    });

    const result = await reader.readOg('https://example.com', 'browser');

    expect(result).toEqual({ 'og:title': 'Browser Page' });
    expect(mockLaunchBrowser).toHaveBeenCalledTimes(1);
    expect(mockExtractOgBrowser).toHaveBeenCalledWith(mockBrowser, 'https://example.com');
    expect(mockBrowserClose).toHaveBeenCalledTimes(1);
  });

  test('reads schemas via curl without launching a browser', async () => {
    const reader = createMetadataReader({
      fetchHtmlCurl: mockFetchHtmlCurl,
      launchBrowser: mockLaunchBrowser,
      extractOgBrowser: mockExtractOgBrowser,
      extractSchemasBrowser: mockExtractSchemasBrowser,
      extractOgFromHtml: mockExtractOgFromHtml,
      extractSchemasFromHtml: mockExtractSchemasFromHtml,
    });

    const result = await reader.readSchemas('https://example.com', 'curl');

    expect(result).toEqual([{ '@type': 'Article', name: 'Test' }]);
    expect(mockFetchHtmlCurl).toHaveBeenCalledWith('https://example.com');
    expect(mockExtractSchemasFromHtml).toHaveBeenCalledWith('<html/>', 'https://example.com');
    expect(mockLaunchBrowser).not.toHaveBeenCalled();
  });

  test('closes browser when browser schema extraction throws', async () => {
    mockExtractSchemasBrowser.mockRejectedValue(new Error('navigation failed'));
    const reader = createMetadataReader({
      fetchHtmlCurl: mockFetchHtmlCurl,
      launchBrowser: mockLaunchBrowser,
      extractOgBrowser: mockExtractOgBrowser,
      extractSchemasBrowser: mockExtractSchemasBrowser,
      extractOgFromHtml: mockExtractOgFromHtml,
      extractSchemasFromHtml: mockExtractSchemasFromHtml,
    });

    await expect(reader.readSchemas('https://example.com', 'browser')).rejects.toThrow('navigation failed');
    expect(mockBrowserClose).toHaveBeenCalledTimes(1);
  });
});

describe('launchDefaultMetadataBrowser', () => {
  test('delegates to chromium.launch', async () => {
    const browser = {} as Browser;
    const launchSpy = spyOn(chromium, 'launch').mockResolvedValue(browser);

    try {
      const result = await launchDefaultMetadataBrowser();

      expect(result).toBe(browser);
      expect(launchSpy).toHaveBeenCalledTimes(1);
    } finally {
      launchSpy.mockRestore();
    }
  });
});
