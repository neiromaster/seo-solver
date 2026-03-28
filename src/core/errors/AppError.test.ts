import { describe, expect, test } from 'bun:test';
import ansis from 'ansis';
import { AppError } from './AppError';

class TestError extends AppError {
  readonly exitCode = 1;
  readonly userMessage = 'test error message';

  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}

function strip(str: string): string {
  return ansis.strip(str);
}

describe('AppError', () => {
  describe('constructor', () => {
    test('sets name to the concrete constructor name', () => {
      // Arrange & Act
      const error = new TestError('test');

      // Assert
      expect(error.name).toBe('TestError');
    });

    test('sets message from parameter', () => {
      // Arrange & Act
      const error = new TestError('something went wrong');

      // Assert
      expect(error.message).toBe('something went wrong');
    });

    test('sets cause when provided', () => {
      // Arrange
      const cause = new Error('inner');

      // Act
      const error = new TestError('outer', cause);

      // Assert
      expect(error.cause).toBe(cause);
    });

    test('sets cause to undefined when not provided', () => {
      // Arrange & Act
      const error = new TestError('test');

      // Assert
      expect(error.cause).toBeUndefined();
    });

    test('is instance of Error', () => {
      // Arrange & Act
      const error = new TestError('test');

      // Assert
      expect(error).toBeInstanceOf(Error);
    });

    test('is instance of AppError', () => {
      // Arrange & Act
      const error = new TestError('test');

      // Assert
      expect(error).toBeInstanceOf(AppError);
    });
  });

  describe('format()', () => {
    test('returns userMessage when no cause', () => {
      // Arrange
      const error = new TestError('test');

      // Act
      const result = error.format();

      // Assert
      expect(strip(result)).toBe('test error message');
    });

    test('appends cause message when cause is Error with different message', () => {
      // Arrange
      const cause = new Error('inner error');
      const error = new TestError('outer', cause);

      // Act
      const result = error.format();

      // Assert
      expect(strip(result)).toBe('test error message\n\n  inner error');
    });

    test('does not append cause when its message matches error message', () => {
      // Arrange
      const cause = new Error('same message');
      const error = new TestError('same message', cause);

      // Act
      const result = error.format();

      // Assert
      expect(strip(result)).toBe('test error message');
    });

    test('does not append when cause is a string', () => {
      // Arrange
      const error = new TestError('test', 'string cause');

      // Act
      const result = error.format();

      // Assert
      expect(strip(result)).toBe('test error message');
    });

    test('does not append when cause is a number', () => {
      // Arrange
      const error = new TestError('test', 42);

      // Act
      const result = error.format();

      // Assert
      expect(strip(result)).toBe('test error message');
    });

    test('does not append when cause is a plain object', () => {
      // Arrange
      const error = new TestError('test', { foo: 'bar' });

      // Act
      const result = error.format();

      // Assert
      expect(strip(result)).toBe('test error message');
    });

    test('does not append when cause is null', () => {
      // Arrange
      const error = new TestError('test', null);

      // Act
      const result = error.format();

      // Assert
      expect(strip(result)).toBe('test error message');
    });

    test('does not append when cause is undefined', () => {
      // Arrange
      const error = new TestError('test', undefined);

      // Act
      const result = error.format();

      // Assert
      expect(strip(result)).toBe('test error message');
    });
  });
});
