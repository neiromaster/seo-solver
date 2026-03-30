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
  metaElements?: unknown[];
  scriptElements?: unknown[];
  gotoThrows?: unknown;
  newPageThrows?: unknown;
  closeThrows?: unknown;
}

function createBrowserMock(options: MockBrowserOptions = {}) {
  const { metaElements = [], scriptElements = [], gotoThrows, newPageThrows, closeThrows } = options;

  const closeMock = closeThrows
    ? mock(async () => {
        throw closeThrows;
      })
    : mock(async () => undefined);
  const gotoMock = gotoThrows
    ? mock(async () => {
        throw gotoThrows;
      })
    : mock(async () => null);
  const locatorMock = mock((selector: string) => ({
    evaluateAll: mock(async (fn: (els: unknown[]) => unknown) =>
      fn(selector === 'meta' ? metaElements : scriptElements),
    ),
  }));
  const pageMock = {
    goto: gotoMock,
    locator: locatorMock,
  };
  const contextMock = {
    newPage: newPageThrows
      ? mock(async () => {
          throw newPageThrows;
        })
      : mock(async () => pageMock),
    close: closeMock,
  };
  const browser = {
    newContext: mock(async () => contextMock),
  } as unknown as Browser;

  return { browser, closeMock, locatorMock, contextMock };
}

describe('extractOgBrowser', () => {
  test('returns OgData for og: and twitter: meta tags', async () => {
    // Arrange
    const { browser } = createBrowserMock({
      metaElements: [
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
      metaElements: [metaEl({ name: 'og:description', content: 'Desc' })],
    });

    // Act
    const result = await extractOgBrowser(browser, 'https://example.com');

    // Assert
    expect(result).toEqual({ 'og:description': 'Desc' });
  });

  test('preserves duplicate og:image tags as arrays', async () => {
    const { browser } = createBrowserMock({
      metaElements: [
        metaEl({ property: 'og:image', content: 'https://img.example.com/a.png' }),
        metaEl({ property: 'og:image', content: 'https://img.example.com/b.png' }),
      ],
    });

    const result = await extractOgBrowser(browser, 'https://example.com');

    expect(result['og:image']).toEqual(['https://img.example.com/a.png', 'https://img.example.com/b.png']);
  });

  test('throws NoDataFoundError when no og: or twitter: meta tags found', async () => {
    // Arrange
    const { browser } = createBrowserMock({ metaElements: [] });

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
      metaElements: [metaEl({ property: 'og:title', content: 'Test' })],
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

  test('queries only meta elements for Open Graph extraction', async () => {
    // Arrange
    const { browser, locatorMock } = createBrowserMock({
      metaElements: [metaEl({ property: 'og:title', content: 'Test' })],
      scriptElements: [scriptEl('{"@type":"Article"}')],
    });

    // Act
    await extractOgBrowser(browser, 'https://example.com');

    // Assert
    expect(locatorMock).toHaveBeenCalledWith('meta');
  });
});

describe('extractSchemasBrowser', () => {
  test('returns normalized schemas when JSON-LD scripts are present', async () => {
    // Arrange
    const { browser } = createBrowserMock({
      scriptElements: [scriptEl('{"@type":"Article","name":"Test Article"}')],
    });

    // Act
    const result = await extractSchemasBrowser(browser, 'https://example.com');

    // Assert
    expect(result).toEqual([{ '@type': 'Article', name: 'Test Article' }]);
  });

  test('throws NoDataFoundError when no JSON-LD script elements found', async () => {
    // Arrange
    const { browser } = createBrowserMock({ scriptElements: [] });

    // Act & Assert
    await expect(extractSchemasBrowser(browser, 'https://example.com')).rejects.toBeInstanceOf(NoDataFoundError);
  });

  test('throws NoDataFoundError when all script textContent is null', async () => {
    // Arrange
    const { browser } = createBrowserMock({ scriptElements: [scriptEl(null), scriptEl(null)] });

    // Act & Assert
    await expect(extractSchemasBrowser(browser, 'https://example.com')).rejects.toBeInstanceOf(NoDataFoundError);
  });

  test('throws JsonParseError when all scripts contain invalid JSON', async () => {
    // Arrange
    const { browser } = createBrowserMock({ scriptElements: [scriptEl('not { valid json')] });

    // Act & Assert
    await expect(extractSchemasBrowser(browser, 'https://example.com')).rejects.toBeInstanceOf(JsonParseError);
  });

  test('returns only valid schemas when some scripts have invalid JSON', async () => {
    // Arrange
    const { browser } = createBrowserMock({
      scriptElements: [scriptEl('{"@type":"Article","name":"Valid"}'), scriptEl('invalid json {{{')],
    });

    // Act
    const result = await extractSchemasBrowser(browser, 'https://example.com');

    // Assert
    expect(result).toEqual([{ '@type': 'Article', name: 'Valid' }]);
  });

  test('preserves valid falsy JSON values instead of treating them as parse failures', async () => {
    // Arrange
    const { browser } = createBrowserMock({
      scriptElements: [scriptEl('0')],
    });

    // Act
    const result = await extractSchemasBrowser(browser, 'https://example.com');

    // Assert
    expect(result).toEqual([]);
  });

  test('normalizes @graph payloads through browser extraction', async () => {
    // Arrange
    const { browser } = createBrowserMock({
      scriptElements: [scriptEl('{"@graph":[{"@type":"Article","name":"Graph item"}]}')],
    });

    // Act
    const result = await extractSchemasBrowser(browser, 'https://example.com');

    // Assert
    expect(result).toEqual([{ '@type': 'Article', name: 'Graph item' }]);
  });

  test('normalizes @type arrays through browser extraction', async () => {
    // Arrange
    const { browser } = createBrowserMock({
      scriptElements: [scriptEl('{"@type":["Article","WebPage"],"name":"Split"}')],
    });

    // Act
    const result = await extractSchemasBrowser(browser, 'https://example.com');

    // Assert
    expect(result).toEqual([
      { '@type': 'Article', name: 'Split' },
      { '@type': 'WebPage', name: 'Split' },
    ]);
  });

  test('normalizes nested arrays through browser extraction', async () => {
    // Arrange
    const { browser } = createBrowserMock({
      scriptElements: [scriptEl('[[{"@type":"Article","name":"Nested"}]]')],
    });

    // Act
    const result = await extractSchemasBrowser(browser, 'https://example.com');

    // Assert
    expect(result).toEqual([{ '@type': 'Article', name: 'Nested' }]);
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
      scriptElements: [scriptEl('{"@type":"Article"}')],
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

  test('swallows ctx.close errors so the original AppError survives', async () => {
    // Arrange
    const appError = new NoDataFoundError('https://example.com', 'schemas');
    const { browser } = createBrowserMock({ gotoThrows: appError, closeThrows: new Error('close failed') });

    // Act
    const thrown = await extractSchemasBrowser(browser, 'https://example.com').catch((e) => e);

    // Assert
    expect(thrown).toBe(appError);
  });

  test('closes context when newPage throws before page callback runs', async () => {
    // Arrange
    const newPageError = new Error('newPage failed');
    const { browser, closeMock } = createBrowserMock({ newPageThrows: newPageError });

    // Act
    await expect(extractSchemasBrowser(browser, 'https://example.com')).rejects.toBeInstanceOf(PlaywrightError);

    // Assert
    expect(closeMock).toHaveBeenCalledTimes(1);
  });

  test('queries only JSON-LD script elements for schema extraction', async () => {
    // Arrange
    const { browser, locatorMock } = createBrowserMock({
      metaElements: [metaEl({ property: 'og:title', content: 'Wrong selector' })],
      scriptElements: [scriptEl('{"@type":"Article"}')],
    });

    // Act
    await extractSchemasBrowser(browser, 'https://example.com');

    // Assert
    expect(locatorMock).toHaveBeenCalledWith('script[type="application/ld+json"]');
  });
});
