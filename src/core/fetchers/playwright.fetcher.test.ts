import { describe, expect, mock, test } from 'bun:test';
import type { Browser } from 'playwright';
import { JsonParseError, NoDataFoundError, PlaywrightError } from '#core/errors';

import { extractOgBrowser, extractSchemasBrowser } from './playwright.fetcher';

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
    const { browser } = createBrowserMock({
      metaElements: [
        metaEl({ property: 'og:title', content: 'Test Page' }),
        metaEl({ property: 'twitter:card', content: 'summary' }),
        metaEl({ name: 'description', content: 'Ignored — not og/twitter' }),
      ],
    });

    const result = await extractOgBrowser(browser, 'https://example.com');

    expect(result).toEqual({ 'og:title': 'Test Page', 'twitter:card': 'summary' });
  });

  test('falls back to name attribute when property is absent', async () => {
    const { browser } = createBrowserMock({
      metaElements: [metaEl({ name: 'og:description', content: 'Desc' })],
    });

    const result = await extractOgBrowser(browser, 'https://example.com');

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
    const { browser } = createBrowserMock({ metaElements: [] });

    await expect(extractOgBrowser(browser, 'https://example.com')).rejects.toBeInstanceOf(NoDataFoundError);
  });

  test('re-throws AppError from page operation unchanged', async () => {
    const appError = new PlaywrightError('https://other.com');
    const { browser } = createBrowserMock({ gotoThrows: appError });

    const thrown = await extractOgBrowser(browser, 'https://example.com').catch((e) => e);

    expect(thrown).toBe(appError);
  });

  test('wraps non-AppError from page operation in PlaywrightError', async () => {
    const { browser } = createBrowserMock({ gotoThrows: new Error('navigation timeout') });

    await expect(extractOgBrowser(browser, 'https://example.com')).rejects.toBeInstanceOf(PlaywrightError);
  });

  test('closes browser context after successful fetch', async () => {
    const { browser, closeMock } = createBrowserMock({
      metaElements: [metaEl({ property: 'og:title', content: 'Test' })],
    });

    await extractOgBrowser(browser, 'https://example.com');

    expect(closeMock).toHaveBeenCalledTimes(1);
  });

  test('closes browser context even when page operation throws', async () => {
    const { browser, closeMock } = createBrowserMock({
      gotoThrows: new Error('page load failed'),
    });

    await extractOgBrowser(browser, 'https://example.com').catch(() => {});

    expect(closeMock).toHaveBeenCalledTimes(1);
  });

  test('queries only meta elements for Open Graph extraction', async () => {
    const { browser, locatorMock } = createBrowserMock({
      metaElements: [metaEl({ property: 'og:title', content: 'Test' })],
      scriptElements: [scriptEl('{"@type":"Article"}')],
    });

    await extractOgBrowser(browser, 'https://example.com');

    expect(locatorMock).toHaveBeenCalledWith('meta');
  });
});

describe('extractSchemasBrowser', () => {
  test('returns normalized schemas when JSON-LD scripts are present', async () => {
    const { browser } = createBrowserMock({
      scriptElements: [scriptEl('{"@type":"Article","name":"Test Article"}')],
    });

    const result = await extractSchemasBrowser(browser, 'https://example.com');

    expect(result).toEqual([{ '@type': 'Article', name: 'Test Article' }]);
  });

  test('throws NoDataFoundError when no JSON-LD script elements found', async () => {
    const { browser } = createBrowserMock({ scriptElements: [] });

    await expect(extractSchemasBrowser(browser, 'https://example.com')).rejects.toBeInstanceOf(NoDataFoundError);
  });

  test('throws NoDataFoundError when all script textContent is null', async () => {
    const { browser } = createBrowserMock({ scriptElements: [scriptEl(null), scriptEl(null)] });

    await expect(extractSchemasBrowser(browser, 'https://example.com')).rejects.toBeInstanceOf(NoDataFoundError);
  });

  test('throws JsonParseError when all scripts contain invalid JSON', async () => {
    const { browser } = createBrowserMock({ scriptElements: [scriptEl('not { valid json')] });

    await expect(extractSchemasBrowser(browser, 'https://example.com')).rejects.toBeInstanceOf(JsonParseError);
  });

  test('returns only valid schemas when some scripts have invalid JSON', async () => {
    const { browser } = createBrowserMock({
      scriptElements: [scriptEl('{"@type":"Article","name":"Valid"}'), scriptEl('invalid json {{{')],
    });

    const result = await extractSchemasBrowser(browser, 'https://example.com');

    expect(result).toEqual([{ '@type': 'Article', name: 'Valid' }]);
  });

  test('preserves valid falsy JSON values instead of treating them as parse failures', async () => {
    const { browser } = createBrowserMock({
      scriptElements: [scriptEl('0')],
    });

    const result = await extractSchemasBrowser(browser, 'https://example.com');

    expect(result).toEqual([]);
  });

  test('normalizes @graph payloads through browser extraction', async () => {
    const { browser } = createBrowserMock({
      scriptElements: [scriptEl('{"@graph":[{"@type":"Article","name":"Graph item"}]}')],
    });

    const result = await extractSchemasBrowser(browser, 'https://example.com');

    expect(result).toEqual([{ '@type': 'Article', name: 'Graph item' }]);
  });

  test('normalizes @type arrays through browser extraction', async () => {
    const { browser } = createBrowserMock({
      scriptElements: [scriptEl('{"@type":["Article","WebPage"],"name":"Split"}')],
    });

    const result = await extractSchemasBrowser(browser, 'https://example.com');

    expect(result).toEqual([
      { '@type': 'Article', name: 'Split' },
      { '@type': 'WebPage', name: 'Split' },
    ]);
  });

  test('normalizes nested arrays through browser extraction', async () => {
    const { browser } = createBrowserMock({
      scriptElements: [scriptEl('[[{"@type":"Article","name":"Nested"}]]')],
    });

    const result = await extractSchemasBrowser(browser, 'https://example.com');

    expect(result).toEqual([{ '@type': 'Article', name: 'Nested' }]);
  });

  test('re-throws AppError from page operation unchanged', async () => {
    const appError = new NoDataFoundError('https://example.com', 'schemas');
    const { browser } = createBrowserMock({ gotoThrows: appError });

    const thrown = await extractSchemasBrowser(browser, 'https://example.com').catch((e) => e);

    expect(thrown).toBe(appError);
  });

  test('wraps non-AppError from page operation in PlaywrightError', async () => {
    const { browser } = createBrowserMock({ gotoThrows: new Error('navigation timeout') });

    await expect(extractSchemasBrowser(browser, 'https://example.com')).rejects.toBeInstanceOf(PlaywrightError);
  });

  test('closes browser context after successful fetch', async () => {
    const { browser, closeMock } = createBrowserMock({
      scriptElements: [scriptEl('{"@type":"Article"}')],
    });

    await extractSchemasBrowser(browser, 'https://example.com');

    expect(closeMock).toHaveBeenCalledTimes(1);
  });

  test('closes browser context even when page operation throws', async () => {
    const { browser, closeMock } = createBrowserMock({
      gotoThrows: new Error('navigation failed'),
    });

    await extractSchemasBrowser(browser, 'https://example.com').catch(() => {});

    expect(closeMock).toHaveBeenCalledTimes(1);
  });

  test('swallows ctx.close errors so the original AppError survives', async () => {
    const appError = new NoDataFoundError('https://example.com', 'schemas');
    const { browser } = createBrowserMock({ gotoThrows: appError, closeThrows: new Error('close failed') });

    const thrown = await extractSchemasBrowser(browser, 'https://example.com').catch((e) => e);

    expect(thrown).toBe(appError);
  });

  test('closes context when newPage throws before page callback runs', async () => {
    const newPageError = new Error('newPage failed');
    const { browser, closeMock } = createBrowserMock({ newPageThrows: newPageError });

    await expect(extractSchemasBrowser(browser, 'https://example.com')).rejects.toBeInstanceOf(PlaywrightError);

    expect(closeMock).toHaveBeenCalledTimes(1);
  });

  test('queries only JSON-LD script elements for schema extraction', async () => {
    const { browser, locatorMock } = createBrowserMock({
      metaElements: [metaEl({ property: 'og:title', content: 'Wrong selector' })],
      scriptElements: [scriptEl('{"@type":"Article"}')],
    });

    await extractSchemasBrowser(browser, 'https://example.com');

    expect(locatorMock).toHaveBeenCalledWith('script[type="application/ld+json"]');
  });
});
