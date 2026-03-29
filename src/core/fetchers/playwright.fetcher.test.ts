import { describe, expect, mock, test } from 'bun:test';
import type { Browser } from 'playwright';
import { JsonParseError, NoDataFoundError, PlaywrightError } from '#core/errors';

import { extractOgBrowser, extractSchemasBrowser } from './playwright.fetcher';

// Minimal mock DOM element factories matching only what the callbacks access

function metaEl(attrs: { property?: string; name?: string; content?: string }) {
  return {
    getAttribute: (attr: string): string | null => {
      if (attr === 'property') return attrs.property ?? null;
      if (attr === 'name') return attrs.name ?? null;
      if (attr === 'content') return attrs.content ?? null;
      return null;
    },
  };
}

function scriptEl(textContent: string | null) {
  return { textContent };
}

interface MockBrowserOptions {
  elements?: unknown[];
  gotoThrows?: unknown;
}

function createBrowserMock(options: MockBrowserOptions = {}) {
  const { elements = [], gotoThrows } = options;

  const closeMock = mock(async () => undefined);
  // Invoke the callback with mock elements so the production callback code runs
  const evaluateAllMock = mock(async (fn: (els: unknown[]) => unknown) => fn(elements));
  const locatorMock = { evaluateAll: evaluateAllMock };
  const gotoMock = gotoThrows
    ? mock(async () => {
        throw gotoThrows;
      })
    : mock(async () => null);
  const pageMock = {
    goto: gotoMock,
    locator: mock(() => locatorMock),
  };
  const contextMock = {
    newPage: mock(async () => pageMock),
    close: closeMock,
  };
  const browser = {
    newContext: mock(async () => contextMock),
  } as unknown as Browser;

  return { browser, closeMock };
}

describe('extractOgBrowser', () => {
  test('returns OgData for og: and twitter: meta tags', async () => {
    // Arrange
    const { browser } = createBrowserMock({
      elements: [
        metaEl({ property: 'og:title', content: 'Test Page' }),
        metaEl({ property: 'twitter:card', content: 'summary' }),
        metaEl({ name: 'description', content: 'Ignored — not og/twitter' }),
      ],
    });

    // Act
    const result = await extractOgBrowser(browser, 'https://example.com');

    // Assert
    expect(result).toEqual({ 'og:title': 'Test Page', 'twitter:card': 'summary' });
  });

  test('falls back to name attribute when property is absent', async () => {
    // Arrange
    const { browser } = createBrowserMock({
      elements: [metaEl({ name: 'og:description', content: 'Desc' })],
    });

    // Act
    const result = await extractOgBrowser(browser, 'https://example.com');

    // Assert
    expect(result).toEqual({ 'og:description': 'Desc' });
  });

  test('throws NoDataFoundError when no og: or twitter: meta tags found', async () => {
    // Arrange
    const { browser } = createBrowserMock({ elements: [] });

    // Act & Assert
    await expect(extractOgBrowser(browser, 'https://example.com')).rejects.toBeInstanceOf(NoDataFoundError);
  });

  test('re-throws AppError from page operation unchanged', async () => {
    // Arrange
    const appError = new PlaywrightError('https://other.com');
    const { browser } = createBrowserMock({ gotoThrows: appError });

    // Act
    const thrown = await extractOgBrowser(browser, 'https://example.com').catch((e) => e);

    // Assert
    expect(thrown).toBe(appError);
  });

  test('wraps non-AppError from page operation in PlaywrightError', async () => {
    // Arrange
    const { browser } = createBrowserMock({ gotoThrows: new Error('navigation timeout') });

    // Act & Assert
    await expect(extractOgBrowser(browser, 'https://example.com')).rejects.toBeInstanceOf(PlaywrightError);
  });

  test('closes browser context after successful fetch', async () => {
    // Arrange
    const { browser, closeMock } = createBrowserMock({
      elements: [metaEl({ property: 'og:title', content: 'Test' })],
    });

    // Act
    await extractOgBrowser(browser, 'https://example.com');

    // Assert
    expect(closeMock).toHaveBeenCalledTimes(1);
  });

  test('closes browser context even when page operation throws', async () => {
    // Arrange
    const { browser, closeMock } = createBrowserMock({
      gotoThrows: new Error('page load failed'),
    });

    // Act
    await extractOgBrowser(browser, 'https://example.com').catch(() => {});

    // Assert
    expect(closeMock).toHaveBeenCalledTimes(1);
  });
});

describe('extractSchemasBrowser', () => {
  test('returns normalized schemas when JSON-LD scripts are present', async () => {
    // Arrange
    const { browser } = createBrowserMock({
      elements: [scriptEl('{"@type":"Article","name":"Test Article"}')],
    });

    // Act
    const result = await extractSchemasBrowser(browser, 'https://example.com');

    // Assert
    expect(result).toEqual([{ '@type': 'Article', name: 'Test Article' }]);
  });

  test('throws NoDataFoundError when no JSON-LD script elements found', async () => {
    // Arrange
    const { browser } = createBrowserMock({ elements: [] });

    // Act & Assert
    await expect(extractSchemasBrowser(browser, 'https://example.com')).rejects.toBeInstanceOf(NoDataFoundError);
  });

  test('throws NoDataFoundError when all script textContent is null', async () => {
    // Arrange
    const { browser } = createBrowserMock({ elements: [scriptEl(null), scriptEl(null)] });

    // Act & Assert
    await expect(extractSchemasBrowser(browser, 'https://example.com')).rejects.toBeInstanceOf(NoDataFoundError);
  });

  test('throws JsonParseError when all scripts contain invalid JSON', async () => {
    // Arrange
    const { browser } = createBrowserMock({ elements: [scriptEl('not { valid json')] });

    // Act & Assert
    await expect(extractSchemasBrowser(browser, 'https://example.com')).rejects.toBeInstanceOf(JsonParseError);
  });

  test('returns only valid schemas when some scripts have invalid JSON', async () => {
    // Arrange
    const { browser } = createBrowserMock({
      elements: [scriptEl('{"@type":"Article","name":"Valid"}'), scriptEl('invalid json {{{')],
    });

    // Act
    const result = await extractSchemasBrowser(browser, 'https://example.com');

    // Assert
    expect(result).toEqual([{ '@type': 'Article', name: 'Valid' }]);
  });

  test('re-throws AppError from page operation unchanged', async () => {
    // Arrange
    const appError = new NoDataFoundError('https://example.com', 'schemas');
    const { browser } = createBrowserMock({ gotoThrows: appError });

    // Act
    const thrown = await extractSchemasBrowser(browser, 'https://example.com').catch((e) => e);

    // Assert
    expect(thrown).toBe(appError);
  });

  test('wraps non-AppError from page operation in PlaywrightError', async () => {
    // Arrange
    const { browser } = createBrowserMock({ gotoThrows: new Error('navigation timeout') });

    // Act & Assert
    await expect(extractSchemasBrowser(browser, 'https://example.com')).rejects.toBeInstanceOf(PlaywrightError);
  });

  test('closes browser context after successful fetch', async () => {
    // Arrange
    const { browser, closeMock } = createBrowserMock({
      elements: [scriptEl('{"@type":"Article"}')],
    });

    // Act
    await extractSchemasBrowser(browser, 'https://example.com');

    // Assert
    expect(closeMock).toHaveBeenCalledTimes(1);
  });

  test('closes browser context even when page operation throws', async () => {
    // Arrange
    const { browser, closeMock } = createBrowserMock({
      gotoThrows: new Error('navigation failed'),
    });

    // Act
    await extractSchemasBrowser(browser, 'https://example.com').catch(() => {});

    // Assert
    expect(closeMock).toHaveBeenCalledTimes(1);
  });
});
