import { afterAll, afterEach, beforeAll, describe, expect, mock, test } from 'bun:test';
import { CurlError } from '#core/errors';

const mockExecFileSync = mock();
let fetchHtmlCurl: typeof import('./curl.fetcher')['fetchHtmlCurl'];

function getExecCall(): unknown[] {
  const call = mockExecFileSync.mock.calls[0];
  expect(call).toBeDefined();
  expect(Array.isArray(call)).toBe(true);
  return call as unknown[];
}

function getThrownCurlError(run: () => void): CurlError {
  try {
    run();
  } catch (error) {
    expect(error).toBeInstanceOf(CurlError);
    if (error instanceof CurlError) {
      return error;
    }
  }

  throw new Error('Expected CurlError to be thrown');
}

beforeAll(async () => {
  mock.module('node:child_process', () => ({
    execFileSync: mockExecFileSync,
  }));

  ({ fetchHtmlCurl } = await import('./curl.fetcher'));
});

afterAll(() => {
  mock.restore();
});

describe('fetchHtmlCurl', () => {
  afterEach(() => {
    mockExecFileSync.mockReset();
  });

  describe('when curl succeeds', () => {
    test('returns HTML string from curl output', () => {
      // Arrange
      mockExecFileSync.mockReturnValue('<html><body>content</body></html>');

      // Act
      const result = fetchHtmlCurl('https://example.com');

      // Assert
      expect(result).toBe('<html><body>content</body></html>');
    });

    test('passes expected curl arguments', () => {
      // Arrange
      mockExecFileSync.mockReturnValue('');

      // Act
      fetchHtmlCurl('https://example.com');

      // Assert
      const [, args] = getExecCall();
      expect(args).toEqual([
        '-sL',
        '--max-time',
        '30',
        '-A',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        '-H',
        'Accept-Language: ru-RU,ru;q=0.9',
        'https://example.com',
      ]);
    });

    test('invokes curl binary', () => {
      // Arrange
      mockExecFileSync.mockReturnValue('');

      // Act
      fetchHtmlCurl('https://example.com');

      // Assert
      const [cmd] = getExecCall();
      expect(cmd).toBe('curl');
    });
  });

  describe('when curl fails', () => {
    test('throws CurlError', () => {
      // Arrange
      mockExecFileSync.mockImplementation(() => {
        throw new Error('curl: (6) Could not resolve host');
      });

      // Act & Assert
      expect(() => fetchHtmlCurl('https://example.com')).toThrow(CurlError);
    });

    test('includes url and fetch method in the thrown CurlError', () => {
      // Arrange
      mockExecFileSync.mockImplementation(() => {
        throw new Error('network failure');
      });

      // Act
      const thrown = getThrownCurlError(() => fetchHtmlCurl('https://example.com'));

      // Assert
      expect(thrown.url).toBe('https://example.com');
      expect(thrown.fetchMethod).toBe('curl');
    });

    test('wraps original error as cause in CurlError', () => {
      // Arrange
      const cause = new Error('ECONNREFUSED 127.0.0.1:443');
      mockExecFileSync.mockImplementation(() => {
        throw cause;
      });

      // Act
      const thrown = getThrownCurlError(() => fetchHtmlCurl('https://example.com'));

      // Assert
      expect(thrown.cause).toBe(cause);
    });

    test('surfaces maxBuffer overflows with a size-specific message', () => {
      // Arrange
      mockExecFileSync.mockImplementation(() => {
        throw new Error('stdout maxBuffer length exceeded');
      });

      // Act
      const thrown = getThrownCurlError(() => fetchHtmlCurl('https://example.com'));

      // Assert
      expect(thrown.cause).toBeInstanceOf(Error);
      expect((thrown.cause as Error).message).toContain('10MB maxBuffer limit');
    });
  });
});
