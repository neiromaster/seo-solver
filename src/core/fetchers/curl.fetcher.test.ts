import { afterAll, afterEach, beforeAll, describe, expect, mock, test } from 'bun:test';
import { CurlError } from '#core/errors';

const mockExecFileSync = mock();
let fetchHtmlCurl: typeof import('./curl.fetcher')['fetchHtmlCurl'];

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

    test('passes url as last argument to curl', () => {
      // Arrange
      mockExecFileSync.mockReturnValue('');

      // Act
      fetchHtmlCurl('https://example.com');

      // Assert
      const [, args] = mockExecFileSync.mock.calls[0] as [string, string[]];
      expect(args.at(-1)).toBe('https://example.com');
    });

    test('invokes curl binary', () => {
      // Arrange
      mockExecFileSync.mockReturnValue('');

      // Act
      fetchHtmlCurl('https://example.com');

      // Assert
      const [cmd] = mockExecFileSync.mock.calls[0] as [string];
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

    test('includes url in the thrown CurlError', () => {
      // Arrange
      mockExecFileSync.mockImplementation(() => {
        throw new Error('network failure');
      });

      // Act
      let thrown: unknown;
      try {
        fetchHtmlCurl('https://example.com');
      } catch (e) {
        thrown = e;
      }

      // Assert
      expect(thrown).toBeInstanceOf(CurlError);
      expect((thrown as CurlError).url).toBe('https://example.com');
    });

    test('wraps original error as cause in CurlError', () => {
      // Arrange
      const cause = new Error('ECONNREFUSED 127.0.0.1:443');
      mockExecFileSync.mockImplementation(() => {
        throw cause;
      });

      // Act
      let thrown: unknown;
      try {
        fetchHtmlCurl('https://example.com');
      } catch (e) {
        thrown = e;
      }

      // Assert
      expect((thrown as CurlError).cause).toBe(cause);
    });
  });
});
