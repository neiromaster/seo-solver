import { describe, expect, test } from 'bun:test';
import { NoDataFoundError } from '#core/errors';
import { extractOgFromHtml } from './opengraph.parser';

const URL = 'https://example.com';

describe('extractOgFromHtml', () => {
  test('throws NoDataFoundError when no og/twitter meta tags found', () => {
    // Arrange
    const html = '<html><head><meta name="description" content="hi"></head></html>';

    // Act & Assert
    expect(() => extractOgFromHtml(html, URL)).toThrow(NoDataFoundError);
  });

  test('throws NoDataFoundError with correct url', () => {
    // Arrange
    const html = '<html><head></head></html>';

    // Act
    let caught: unknown;
    try {
      extractOgFromHtml(html, URL);
    } catch (e) {
      caught = e;
    }

    // Assert
    expect(caught).toBeInstanceOf(NoDataFoundError);
    expect((caught as NoDataFoundError).userMessage).toContain(URL);
  });

  test('throws NoDataFoundError with opengraph type', () => {
    // Arrange
    const html = '<p>no meta tags</p>';

    // Act
    let caught: unknown;
    try {
      extractOgFromHtml(html, URL);
    } catch (e) {
      caught = e;
    }

    // Assert
    expect((caught as NoDataFoundError).message).toBe('No opengraph found');
  });

  test('returns og:title from property attribute', () => {
    // Arrange
    const html = '<meta property="og:title" content="Hello World">';

    // Act
    const result = extractOgFromHtml(html, URL);

    // Assert
    expect(result['og:title']).toBe('Hello World');
  });

  test('returns twitter: tag from name attribute', () => {
    // Arrange
    const html = '<meta name="twitter:card" content="summary">';

    // Act
    const result = extractOgFromHtml(html, URL);

    // Assert
    expect(result['twitter:card']).toBe('summary');
  });

  test('collects multiple og tags', () => {
    // Arrange
    const html = [
      '<meta property="og:title" content="Title">',
      '<meta property="og:description" content="Desc">',
      '<meta property="og:image" content="https://img.example.com/x.png">',
    ].join('');

    // Act
    const result = extractOgFromHtml(html, URL);

    // Assert
    expect(result['og:title']).toBe('Title');
    expect(result['og:description']).toBe('Desc');
    expect(result['og:image']).toBe('https://img.example.com/x.png');
  });

  test('collects both og: and twitter: tags together', () => {
    // Arrange
    const html = ['<meta property="og:title" content="Title">', '<meta name="twitter:card" content="summary">'].join(
      '',
    );

    // Act
    const result = extractOgFromHtml(html, URL);

    // Assert
    expect(result['og:title']).toBe('Title');
    expect(result['twitter:card']).toBe('summary');
  });

  test('ignores meta tags without og: or twitter: prefix', () => {
    // Arrange
    const html = [
      '<meta name="description" content="plain desc">',
      '<meta property="og:title" content="OG Title">',
    ].join('');

    // Act
    const result = extractOgFromHtml(html, URL);

    // Assert
    expect(Object.keys(result)).toEqual(['og:title']);
  });

  test('handles empty content attribute', () => {
    // Arrange
    const html = '<meta property="og:title" content="">';

    // Act
    const result = extractOgFromHtml(html, URL);

    // Assert
    expect(result['og:title']).toBe('');
  });

  test('handles single-quoted attribute values', () => {
    // Arrange
    const html = "<meta property='og:title' content='Single Quoted'>";

    // Act
    const result = extractOgFromHtml(html, URL);

    // Assert
    expect(result['og:title']).toBe('Single Quoted');
  });

  test('handles case-insensitive meta tag matching', () => {
    // Arrange
    const html = '<META PROPERTY="og:title" CONTENT="Upper Case">';

    // Act
    const result = extractOgFromHtml(html, URL);

    // Assert
    expect(result['og:title']).toBe('Upper Case');
  });

  test('skips meta tag without content attribute', () => {
    // Arrange
    const html = ['<meta property="og:title">', '<meta property="og:description" content="Desc">'].join('');

    // Act
    const result = extractOgFromHtml(html, URL);

    // Assert
    expect(Object.keys(result)).toEqual(['og:description']);
  });

  test('returns OgData object (not array)', () => {
    // Arrange
    const html = '<meta property="og:title" content="Test">';

    // Act
    const result = extractOgFromHtml(html, URL);

    // Assert
    expect(typeof result).toBe('object');
    expect(Array.isArray(result)).toBe(false);
  });
});
