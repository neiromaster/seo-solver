import { beforeEach, describe, expect, mock, spyOn, test } from 'bun:test';
import { type Browser, chromium } from 'playwright';
import type { OgData, Schema } from '#types';
import { connectDefaultMetadataBrowser, createMetadataReader, launchDefaultMetadataBrowser } from './metadata-reader';

const mockFetchHtmlBasic = mock(async () => '<html data-basic/>');
const mockFetchHtmlCurl = mock(async () => '<html/>');
const mockExtractOgFromHtml = mock(() => ({ 'og:title': 'Page' }) as OgData);
const mockExtractSchemasFromHtml = mock(() => [{ '@type': 'Article', name: 'Test' }] as Schema[]);
const mockExtractOgBrowser = mock(async () => ({ 'og:title': 'Browser Page' }) as OgData);
const mockExtractSchemasBrowser = mock(async () => [{ '@type': 'Product', name: 'Browser Test' }] as Schema[]);
const mockBrowserClose = mock(async () => undefined);
const mockBrowser = { close: mockBrowserClose } as unknown as Browser;
const mockLaunchBrowser = mock(async () => mockBrowser);
const mockConnectBrowser = mock(async () => mockBrowser);

describe('createMetadataReader', () => {
  beforeEach(() => {
    mockFetchHtmlBasic.mockReset();
    mockFetchHtmlCurl.mockReset();
    mockExtractOgFromHtml.mockReset();
    mockExtractSchemasFromHtml.mockReset();
    mockExtractOgBrowser.mockReset();
    mockExtractSchemasBrowser.mockReset();
    mockBrowserClose.mockReset();
    mockLaunchBrowser.mockReset();
    mockConnectBrowser.mockReset();

    mockFetchHtmlBasic.mockResolvedValue('<html data-basic/>');
    mockFetchHtmlCurl.mockResolvedValue('<html/>');
    mockExtractOgFromHtml.mockReturnValue({ 'og:title': 'Page' });
    mockExtractSchemasFromHtml.mockReturnValue([{ '@type': 'Article', name: 'Test' }]);
    mockExtractOgBrowser.mockResolvedValue({ 'og:title': 'Browser Page' });
    mockExtractSchemasBrowser.mockResolvedValue([{ '@type': 'Product', name: 'Browser Test' }]);
    mockBrowserClose.mockResolvedValue(undefined);
    mockLaunchBrowser.mockResolvedValue(mockBrowser);
    mockConnectBrowser.mockResolvedValue(mockBrowser);
  });

  test('reads OG via basic fetch without launching a browser', async () => {
    const reader = createMetadataReader({
      fetchHtmlBasic: mockFetchHtmlBasic,
      fetchHtmlCurl: mockFetchHtmlCurl,
      launchBrowser: mockLaunchBrowser,
      connectBrowser: mockConnectBrowser,
      extractOgBrowser: mockExtractOgBrowser,
      extractSchemasBrowser: mockExtractSchemasBrowser,
      extractOgFromHtml: mockExtractOgFromHtml,
      extractSchemasFromHtml: mockExtractSchemasFromHtml,
    });

    const result = await reader.readOg('https://example.com', { type: 'basic' });

    expect(result).toEqual({ 'og:title': 'Page' });
    expect(mockFetchHtmlBasic).toHaveBeenCalledWith('https://example.com');
    expect(mockExtractOgFromHtml).toHaveBeenCalledWith('<html data-basic/>', 'https://example.com');
    expect(mockLaunchBrowser).not.toHaveBeenCalled();
    expect(mockConnectBrowser).not.toHaveBeenCalled();
  });

  test('reads schemas via browser launch and closes browser on success', async () => {
    const reader = createMetadataReader({
      fetchHtmlBasic: mockFetchHtmlBasic,
      fetchHtmlCurl: mockFetchHtmlCurl,
      launchBrowser: mockLaunchBrowser,
      connectBrowser: mockConnectBrowser,
      extractOgBrowser: mockExtractOgBrowser,
      extractSchemasBrowser: mockExtractSchemasBrowser,
      extractOgFromHtml: mockExtractOgFromHtml,
      extractSchemasFromHtml: mockExtractSchemasFromHtml,
    });

    const result = await reader.readSchemas('https://example.com', { type: 'chrome', mode: 'launch' });

    expect(result).toEqual([{ '@type': 'Product', name: 'Browser Test' }]);
    expect(mockLaunchBrowser).toHaveBeenCalledTimes(1);
    expect(mockConnectBrowser).not.toHaveBeenCalled();
    expect(mockExtractSchemasBrowser).toHaveBeenCalledWith(mockBrowser, 'https://example.com');
    expect(mockBrowserClose).toHaveBeenCalledTimes(1);
    expect(mockFetchHtmlCurl).not.toHaveBeenCalled();
  });

  test('reads OG via browser connect and closes browser on success', async () => {
    const reader = createMetadataReader({
      fetchHtmlBasic: mockFetchHtmlBasic,
      fetchHtmlCurl: mockFetchHtmlCurl,
      launchBrowser: mockLaunchBrowser,
      connectBrowser: mockConnectBrowser,
      extractOgBrowser: mockExtractOgBrowser,
      extractSchemasBrowser: mockExtractSchemasBrowser,
      extractOgFromHtml: mockExtractOgFromHtml,
      extractSchemasFromHtml: mockExtractSchemasFromHtml,
    });

    const result = await reader.readOg('https://example.com', {
      type: 'chrome',
      mode: 'connect',
      target: 'localhost:9222',
    });

    expect(result).toEqual({ 'og:title': 'Browser Page' });
    expect(mockLaunchBrowser).not.toHaveBeenCalled();
    expect(mockConnectBrowser).toHaveBeenCalledWith('localhost:9222');
    expect(mockExtractOgBrowser).toHaveBeenCalledWith(mockBrowser, 'https://example.com');
    expect(mockBrowserClose).toHaveBeenCalledTimes(1);
  });

  test('reads schemas via curl without launching a browser', async () => {
    const reader = createMetadataReader({
      fetchHtmlBasic: mockFetchHtmlBasic,
      fetchHtmlCurl: mockFetchHtmlCurl,
      launchBrowser: mockLaunchBrowser,
      connectBrowser: mockConnectBrowser,
      extractOgBrowser: mockExtractOgBrowser,
      extractSchemasBrowser: mockExtractSchemasBrowser,
      extractOgFromHtml: mockExtractOgFromHtml,
      extractSchemasFromHtml: mockExtractSchemasFromHtml,
    });

    const result = await reader.readSchemas('https://example.com', { type: 'curl' });

    expect(result).toEqual([{ '@type': 'Article', name: 'Test' }]);
    expect(mockFetchHtmlCurl).toHaveBeenCalledWith('https://example.com');
    expect(mockExtractSchemasFromHtml).toHaveBeenCalledWith('<html/>', 'https://example.com');
    expect(mockLaunchBrowser).not.toHaveBeenCalled();
    expect(mockConnectBrowser).not.toHaveBeenCalled();
  });

  test('closes browser when browser schema extraction throws', async () => {
    mockExtractSchemasBrowser.mockRejectedValue(new Error('navigation failed'));
    const reader = createMetadataReader({
      fetchHtmlBasic: mockFetchHtmlBasic,
      fetchHtmlCurl: mockFetchHtmlCurl,
      launchBrowser: mockLaunchBrowser,
      connectBrowser: mockConnectBrowser,
      extractOgBrowser: mockExtractOgBrowser,
      extractSchemasBrowser: mockExtractSchemasBrowser,
      extractOgFromHtml: mockExtractOgFromHtml,
      extractSchemasFromHtml: mockExtractSchemasFromHtml,
    });

    await expect(reader.readSchemas('https://example.com', { type: 'chrome', mode: 'launch' })).rejects.toThrow(
      'navigation failed',
    );
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

describe('connectDefaultMetadataBrowser', () => {
  test('connects to local host:port targets over CDP', async () => {
    const browser = {} as Browser;
    const connectSpy = spyOn(chromium, 'connectOverCDP').mockResolvedValue(browser);

    try {
      const result = await connectDefaultMetadataBrowser('localhost:9222');

      expect(result).toBe(browser);
      expect(connectSpy).toHaveBeenCalledWith('http://localhost:9222');
    } finally {
      connectSpy.mockRestore();
    }
  });
});
