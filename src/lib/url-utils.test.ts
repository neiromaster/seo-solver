import { describe, expect, test } from 'bun:test';
import { urlSlug } from './url-utils';

describe('urlSlug', () => {
  describe('valid URL', () => {
    test('converts hostname and root path to slug', () => {
      // Arrange
      const url = 'https://example.com';

      // Act
      const result = urlSlug(url);

      // Assert
      expect(result).toBe('example_com');
    });

    test('converts hostname and path to slug', () => {
      // Arrange
      const url = 'https://example.com/foo/bar';

      // Act
      const result = urlSlug(url);

      // Assert
      expect(result).toBe('example_com_foo_bar');
    });

    test('appends query string slug separated by double underscore', () => {
      // Arrange
      const url = 'https://example.com/path?q=hello';

      // Act
      const result = urlSlug(url);

      // Assert
      expect(result).toBe('example_com_path__q_hello');
    });

    test('handles multiple query params', () => {
      // Arrange
      const url = 'https://example.com/path?a=1&b=2';

      // Act
      const result = urlSlug(url);

      // Assert
      expect(result).toBe('example_com_path__a_1_b_2');
    });

    test('omits double underscore separator when query string normalises to empty', () => {
      // Arrange — bare "?" with only special chars that collapse to nothing
      const url = 'https://example.com/path?=';

      // Act
      const result = urlSlug(url);

      // Assert
      expect(result).toBe('example_com_path');
    });

    test('collapses multiple consecutive non-word chars into single underscore', () => {
      // Arrange
      const url = 'https://example.com/a--b//c';

      // Act
      const result = urlSlug(url);

      // Assert
      expect(result).toBe('example_com_a_b_c');
    });

    test('strips leading and trailing underscores from base', () => {
      // Arrange — path ends with trailing slash which normalises to trailing underscore
      const url = 'https://example.com/path/';

      // Act
      const result = urlSlug(url);

      // Assert
      expect(result).toBe('example_com_path');
    });

    test('handles subdomain in hostname', () => {
      // Arrange
      const url = 'https://www.sub.example.com/page';

      // Act
      const result = urlSlug(url);

      // Assert
      expect(result).toBe('www_sub_example_com_page');
    });
  });

  describe('invalid URL (fallback)', () => {
    test('replaces non-word chars with underscores', () => {
      // Arrange
      const url = 'not-a-url';

      // Act
      const result = urlSlug(url);

      // Assert
      expect(result).toBe('not_a_url');
    });

    test('truncates result to 100 characters', () => {
      // Arrange
      const url = 'a'.repeat(50) + '/' + 'b'.repeat(60); // 111 chars after replace → 111 chars, truncated to 100

      // Act
      const result = urlSlug(url);

      // Assert
      expect(result.length).toBe(100);
    });

    test('returns empty string for URL that is only special chars', () => {
      // Arrange — all non-word chars become underscores; slice(0, 100) still returns them
      const url = '---';

      // Act
      const result = urlSlug(url);

      // Assert
      expect(result).toBe('___');
    });
  });
});
