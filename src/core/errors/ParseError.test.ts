import { describe, expect, test } from 'bun:test';
import ansis from 'ansis';
import { HtmlStructureError, JsonParseError, NoDataFoundError, ParseError } from './ParseError';

function strip(str: string): string {
  return ansis.strip(str);
}

describe('ParseError', () => {
  describe('constructor', () => {
    test('sets url property', () => {
      // Arrange & Act
      const error = new ParseError('test', 'https://example.com', 'jsonld');

      // Assert
      expect(error.url).toBe('https://example.com');
    });

    test('sets parseType property', () => {
      // Arrange & Act
      const error = new ParseError('test', 'https://example.com', 'html');

      // Assert
      expect(error.parseType).toBe('html');
    });

    test('sets exitCode to 1', () => {
      // Arrange & Act
      const error = new ParseError('test', 'https://example.com', 'jsonld');

      // Assert
      expect(error.exitCode).toBe(1);
    });

    test('sets userMessage with parseType and url', () => {
      // Arrange & Act
      const error = new ParseError('test', 'https://example.com', 'opengraph');

      // Assert
      expect(strip(error.userMessage)).toBe('Parse error (opengraph) for https://example.com');
    });

    test('passes cause to parent', () => {
      // Arrange
      const cause = new Error('unexpected token');

      // Act
      const error = new ParseError('test', 'https://example.com', 'jsonld', cause);

      // Assert
      expect(error.cause).toBe(cause);
    });

    test('creates without cause', () => {
      // Arrange & Act
      const error = new ParseError('test', 'https://example.com', 'jsonld');

      // Assert
      expect(error.cause).toBeUndefined();
    });
  });

  test('format() returns userMessage when no cause', () => {
    // Arrange
    const error = new ParseError('test', 'https://example.com', 'jsonld');

    // Act
    const result = error.format();

    // Assert
    expect(strip(result)).toBe('Parse error (jsonld) for https://example.com');
  });

  test('format() appends cause message when cause is Error with different message', () => {
    // Arrange
    const cause = new Error('unexpected token at position 5');
    const error = new ParseError('test', 'https://example.com', 'jsonld', cause);

    // Act
    const result = error.format();

    // Assert
    expect(strip(result)).toContain('unexpected token at position 5');
  });
});

describe('JsonParseError', () => {
  test('sets parseType to jsonld', () => {
    // Arrange & Act
    const error = new JsonParseError('https://example.com');

    // Assert
    expect(error.parseType).toBe('jsonld');
  });

  test('sets message to Failed to parse JSON-LD', () => {
    // Arrange & Act
    const error = new JsonParseError('https://example.com');

    // Assert
    expect(error.message).toBe('Failed to parse JSON-LD');
  });

  test('passes cause to parent', () => {
    // Arrange
    const cause = new Error('Unexpected token <');

    // Act
    const error = new JsonParseError('https://example.com', cause);

    // Assert
    expect(error.cause).toBe(cause);
  });

  test('creates without cause', () => {
    // Arrange & Act
    const error = new JsonParseError('https://example.com');

    // Assert
    expect(error.cause).toBeUndefined();
  });

  test('sets exitCode to 1', () => {
    // Arrange & Act
    const error = new JsonParseError('https://example.com');

    // Assert
    expect(error.exitCode).toBe(1);
  });

  test('sets url', () => {
    // Arrange & Act
    const error = new JsonParseError('https://example.com');

    // Assert
    expect(error.url).toBe('https://example.com');
  });
});

describe('HtmlStructureError', () => {
  test('sets parseType to html', () => {
    // Arrange & Act
    const error = new HtmlStructureError('https://example.com', 'missing <html>');

    // Assert
    expect(error.parseType).toBe('html');
  });

  test('includes details in message', () => {
    // Arrange & Act
    const error = new HtmlStructureError('https://example.com', 'missing <html>');

    // Assert
    expect(error.message).toContain('missing <html>');
  });

  test('sets url', () => {
    // Arrange & Act
    const error = new HtmlStructureError('https://example.com', 'details');

    // Assert
    expect(error.url).toBe('https://example.com');
  });

  test('sets exitCode to 1', () => {
    // Arrange & Act
    const error = new HtmlStructureError('https://example.com', 'details');

    // Assert
    expect(error.exitCode).toBe(1);
  });
});

describe('NoDataFoundError', () => {
  test('sets exitCode to 0', () => {
    // Arrange & Act
    const error = new NoDataFoundError('https://example.com', 'schemas');

    // Assert
    expect(error.exitCode).toBe(0);
  });

  test('sets userMessage with type schemas and url', () => {
    // Arrange & Act
    const error = new NoDataFoundError('https://example.com', 'schemas');

    // Assert
    expect(error.userMessage).toBe('No schemas found on https://example.com');
  });

  test('sets userMessage with type opengraph and url', () => {
    // Arrange & Act
    const error = new NoDataFoundError('https://example.com', 'opengraph');

    // Assert
    expect(error.userMessage).toBe('No opengraph found on https://example.com');
  });

  test('sets message to include type', () => {
    // Arrange & Act
    const error = new NoDataFoundError('https://example.com', 'schemas');

    // Assert
    expect(error.message).toBe('No schemas found');
  });

  test('is instance of AppError', () => {
    // Arrange & Act
    const error = new NoDataFoundError('https://example.com', 'schemas');

    // Assert
    expect(error).toBeInstanceOf(Error);
  });

  test('format() returns userMessage', () => {
    // Arrange
    const error = new NoDataFoundError('https://example.com', 'opengraph');

    // Act
    const result = error.format();

    // Assert
    expect(result).toBe('No opengraph found on https://example.com');
  });
});
