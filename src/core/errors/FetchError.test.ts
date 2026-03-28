import { describe, expect, test } from 'bun:test';
import ansis from 'ansis';
import { CurlError, FetchError, PlaywrightError } from './FetchError';

function strip(str: string): string {
  return ansis.strip(str);
}

describe('FetchError', () => {
  describe('constructor', () => {
    test('sets url property', () => {
      // Arrange & Act
      const error = new FetchError('test', 'https://example.com', 'curl');

      // Assert
      expect(error.url).toBe('https://example.com');
    });

    test('sets fetchMethod property', () => {
      // Arrange & Act
      const error = new FetchError('test', 'https://example.com', 'playwright');

      // Assert
      expect(error.fetchMethod).toBe('playwright');
    });

    test('sets exitCode to 1', () => {
      // Arrange & Act
      const error = new FetchError('test', 'https://example.com', 'curl');

      // Assert
      expect(error.exitCode).toBe(1);
    });

    test('sets userMessage containing URL and fetchMethod', () => {
      // Arrange & Act
      const error = new FetchError('test', 'https://example.com', 'curl');

      // Assert
      expect(strip(error.userMessage)).toBe('Error fetching https://example.com (curl)');
    });

    test('passes cause to parent', () => {
      // Arrange
      const cause = new Error('network');

      // Act
      const error = new FetchError('test', 'https://example.com', 'curl', cause);

      // Assert
      expect(error.cause).toBe(cause);
    });
  });

  describe('getSuggestion()', () => {
    test('suggests --curl for playwright method', () => {
      // Arrange
      const error = new FetchError('test', 'https://example.com', 'playwright');

      // Act
      const suggestion = error.getSuggestion();

      // Assert
      expect(strip(suggestion)).toContain('--curl');
      expect(strip(suggestion)).toContain('SSR HTML fetching');
    });

    test('suggests without --curl for curl method', () => {
      // Arrange
      const error = new FetchError('test', 'https://example.com', 'curl');

      // Act
      const suggestion = error.getSuggestion();

      // Assert
      expect(strip(suggestion)).toContain('without --curl');
      expect(strip(suggestion)).toContain('browser');
    });
  });

  describe('format()', () => {
    test('composes userMessage with suggestion for curl', () => {
      // Arrange
      const error = new CurlError('https://example.com');

      // Act
      const result = error.format();

      // Assert
      const stripped = strip(result);
      expect(stripped).toContain('Error fetching https://example.com (curl)');
      expect(stripped).toContain('without --curl');
    });

    test('composes userMessage with suggestion for playwright', () => {
      // Arrange
      const error = new PlaywrightError('https://example.com');

      // Act
      const result = error.format();

      // Assert
      const stripped = strip(result);
      expect(stripped).toContain('Error fetching https://example.com (playwright)');
      expect(stripped).toContain('--curl');
    });

    test('includes cause message when cause has different message', () => {
      // Arrange
      const cause = new Error('connection refused');
      const error = new FetchError('test', 'https://example.com', 'curl', cause);

      // Act
      const result = error.format();

      // Assert
      expect(strip(result)).toContain('connection refused');
    });
  });
});

describe('CurlError', () => {
  test('sets fetchMethod to curl', () => {
    // Arrange & Act
    const error = new CurlError('https://example.com');

    // Assert
    expect(error.fetchMethod).toBe('curl');
  });

  test('sets message to curl execution failed', () => {
    // Arrange & Act
    const error = new CurlError('https://example.com');

    // Assert
    expect(error.message).toBe('curl execution failed');
  });

  test('passes url and cause to parent', () => {
    // Arrange
    const cause = new Error('ECONNREFUSED');

    // Act
    const error = new CurlError('https://example.com', cause);

    // Assert
    expect(error.url).toBe('https://example.com');
    expect(error.cause).toBe(cause);
  });

  test('sets exitCode to 1', () => {
    // Arrange & Act
    const error = new CurlError('https://example.com');

    // Assert
    expect(error.exitCode).toBe(1);
  });

  test('creates without cause', () => {
    // Arrange & Act
    const error = new CurlError('https://example.com');

    // Assert
    expect(error.cause).toBeUndefined();
  });
});

describe('PlaywrightError', () => {
  test('sets fetchMethod to playwright', () => {
    // Arrange & Act
    const error = new PlaywrightError('https://example.com');

    // Assert
    expect(error.fetchMethod).toBe('playwright');
  });

  test('sets message to browser operation failed', () => {
    // Arrange & Act
    const error = new PlaywrightError('https://example.com');

    // Assert
    expect(error.message).toBe('browser operation failed');
  });

  test('passes url and cause to parent', () => {
    // Arrange
    const cause = new Error('timeout');

    // Act
    const error = new PlaywrightError('https://example.com', cause);

    // Assert
    expect(error.url).toBe('https://example.com');
    expect(error.cause).toBe(cause);
  });

  test('sets exitCode to 1', () => {
    // Arrange & Act
    const error = new PlaywrightError('https://example.com');

    // Assert
    expect(error.exitCode).toBe(1);
  });

  test('creates without cause', () => {
    // Arrange & Act
    const error = new PlaywrightError('https://example.com');

    // Assert
    expect(error.cause).toBeUndefined();
  });
});
