import { describe, expect, test } from 'bun:test';
import { JsonParseError, NoDataFoundError } from '#core/errors';
import { extractSchemasFromHtml, normalizeSchemas } from './jsonld.parser';

const URL = 'https://example.com';

describe('extractSchemasFromHtml', () => {
  test('throws NoDataFoundError when no ld+json scripts found', () => {
    // Arrange
    const html = '<html><head></head><body></body></html>';

    // Act & Assert
    expect(() => extractSchemasFromHtml(html, URL)).toThrow(NoDataFoundError);
  });

  test('throws NoDataFoundError with correct url and type', () => {
    // Arrange
    const html = '<p>no scripts</p>';

    // Act
    let caught: unknown;
    try {
      extractSchemasFromHtml(html, URL);
    } catch (e) {
      caught = e;
    }

    // Assert
    expect(caught).toBeInstanceOf(NoDataFoundError);
    expect((caught as NoDataFoundError).userMessage).toContain(URL);
    expect((caught as NoDataFoundError).message).toBe('No schemas found');
  });

  test('throws JsonParseError when all scripts contain invalid JSON', () => {
    // Arrange
    const html = '<script type="application/ld+json">{ invalid json }</script>';

    // Act & Assert
    expect(() => extractSchemasFromHtml(html, URL)).toThrow(JsonParseError);
  });

  test('throws JsonParseError with correct url', () => {
    // Arrange
    const html = '<script type="application/ld+json">not json at all</script>';

    // Act
    let caught: unknown;
    try {
      extractSchemasFromHtml(html, URL);
    } catch (e) {
      caught = e;
    }

    // Assert
    expect(caught).toBeInstanceOf(JsonParseError);
    expect((caught as JsonParseError).url).toBe(URL);
  });

  test('returns parsed schemas for valid JSON-LD', () => {
    // Arrange
    const schema = { '@type': 'Article', name: 'Test' };
    const html = `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;

    // Act
    const result = extractSchemasFromHtml(html, URL);

    // Assert
    expect(result).toEqual([schema]);
  });

  test('skips invalid JSON scripts and returns valid ones', () => {
    // Arrange
    const schema = { '@type': 'Person', name: 'Alice' };
    const html = [
      '<script type="application/ld+json">{ bad json }</script>',
      `<script type="application/ld+json">${JSON.stringify(schema)}</script>`,
    ].join('');

    // Act
    const result = extractSchemasFromHtml(html, URL);

    // Assert
    expect(result).toEqual([schema]);
  });

  test('handles multiple valid JSON-LD scripts', () => {
    // Arrange
    const s1 = { '@type': 'Article', name: 'A' };
    const s2 = { '@type': 'Person', name: 'B' };
    const html = [
      `<script type="application/ld+json">${JSON.stringify(s1)}</script>`,
      `<script type="application/ld+json">${JSON.stringify(s2)}</script>`,
    ].join('');

    // Act
    const result = extractSchemasFromHtml(html, URL);

    // Assert
    expect(result).toHaveLength(2);
    expect(result).toContainEqual(s1);
    expect(result).toContainEqual(s2);
  });

  test('uses case-insensitive matching for script tag', () => {
    // Arrange
    const schema = { '@type': 'WebPage' };
    const html = `<SCRIPT TYPE="application/ld+json">${JSON.stringify(schema)}</SCRIPT>`;

    // Act
    const result = extractSchemasFromHtml(html, URL);

    // Assert
    expect(result).toEqual([schema]);
  });

  test('passes cause to JsonParseError', () => {
    // Arrange
    const html = '<script type="application/ld+json">{ oops }</script>';

    // Act
    let caught: unknown;
    try {
      extractSchemasFromHtml(html, URL);
    } catch (e) {
      caught = e;
    }

    // Assert
    expect((caught as JsonParseError).cause).toBeInstanceOf(SyntaxError);
  });
});

describe('normalizeSchemas', () => {
  test('returns flat schema as-is', () => {
    // Arrange
    const schema = { '@type': 'Article', name: 'Test' };

    // Act
    const result = normalizeSchemas([schema]);

    // Assert
    expect(result).toEqual([schema]);
  });

  test('flattens nested arrays', () => {
    // Arrange
    const s1 = { '@type': 'A' };
    const s2 = { '@type': 'B' };

    // Act
    const result = normalizeSchemas([[s1, s2]]);

    // Assert
    expect(result).toEqual([s1, s2]);
  });

  test('expands @graph into individual items', () => {
    // Arrange
    const inner = { '@type': 'Person', name: 'Bob' };
    const schema = { '@graph': [inner] };

    // Act
    const result = normalizeSchemas([schema]);

    // Assert
    expect(result).toEqual([inner]);
  });

  test('expands @type array into separate schemas', () => {
    // Arrange
    const schema = { '@type': ['Article', 'NewsArticle'], name: 'Test' };

    // Act
    const result = normalizeSchemas([schema]);

    // Assert
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ '@type': 'Article', name: 'Test' });
    expect(result[1]).toEqual({ '@type': 'NewsArticle', name: 'Test' });
  });

  test('skips null values', () => {
    // Arrange
    const schema = { '@type': 'Article' };

    // Act
    const result = normalizeSchemas([null, schema]);

    // Assert
    expect(result).toEqual([schema]);
  });

  test('skips non-object primitives', () => {
    // Arrange
    const schema = { '@type': 'Article' };

    // Act
    const result = normalizeSchemas([42, 'string', true, schema]);

    // Assert
    expect(result).toEqual([schema]);
  });

  test('returns empty array for empty input', () => {
    // Arrange & Act
    const result = normalizeSchemas([]);

    // Assert
    expect(result).toEqual([]);
  });

  test('handles deeply nested @graph', () => {
    // Arrange
    const leaf = { '@type': 'Thing' };
    const outer = { '@graph': [{ '@graph': [leaf] }] };

    // Act
    const result = normalizeSchemas([outer]);

    // Assert
    expect(result).toEqual([leaf]);
  });
});
