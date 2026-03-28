import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import ansis from 'ansis';
import { CurlError } from './FetchError';
import { ExitCode, handleError, safeRun } from './handler';
import { NoDataFoundError } from './ParseError';

function strip(str: string): string {
  return ansis.strip(str);
}

describe('ExitCode', () => {
  test('Success is 0', () => {
    expect(ExitCode.Success).toBe(0);
  });

  test('ExpectedError is 1', () => {
    expect(ExitCode.ExpectedError).toBe(1);
  });

  test('UnexpectedError is 2', () => {
    expect(ExitCode.UnexpectedError).toBe(2);
  });
});

describe('handleError', () => {
  let exitCode: number | undefined;
  let errors: string[];
  const originalExit = process.exit;
  const originalStderr = console.error;

  beforeEach(() => {
    exitCode = undefined;
    errors = [];
    process.exit = ((code?: number) => {
      exitCode = code ?? 0;
      throw new Error('__PROCESS_EXIT__');
    }) as typeof process.exit;
    console.error = (...args: unknown[]) => {
      errors.push(args.map(String).join(' '));
    };
  });

  afterEach(() => {
    process.exit = originalExit;
    console.error = originalStderr;
  });

  function output(): string {
    return errors.map(strip).join('\n');
  }

  function run(fn: () => void): void {
    try {
      fn();
    } catch (e) {
      if (e instanceof Error && e.message !== '__PROCESS_EXIT__') throw e;
    }
  }

  describe('AppError path', () => {
    test('prints formatted error and exits with error exitCode', () => {
      // Arrange
      const error = new CurlError('https://example.com');

      // Act
      run(() => handleError(error));

      // Assert
      expect(exitCode).toBe(1);
      expect(output()).toContain('Error fetching');
      expect(output()).toContain('https://example.com');
    });

    test('exits with exitCode 0 for NoDataFoundError', () => {
      // Arrange
      const error = new NoDataFoundError('https://example.com', 'schemas');

      // Act
      run(() => handleError(error));

      // Assert
      expect(exitCode).toBe(0);
      expect(output()).toContain('No schemas found on https://example.com');
    });

    test('prints error header banner', () => {
      // Arrange
      const error = new CurlError('https://example.com');

      // Act
      run(() => handleError(error));

      // Assert
      expect(output()).toContain('Error');
    });
  });

  describe('duck-typing path', () => {
    test('accepts object with exitCode and format properties', () => {
      // Arrange
      const error = Object.assign(new Error('duck typed'), {
        exitCode: 3,
        format: () => 'formatted duck',
      });

      // Act
      run(() => handleError(error));

      // Assert
      expect(exitCode).toBe(3);
      expect(output()).toContain('formatted duck');
    });
  });

  describe('unexpected Error path', () => {
    test('prints unexpected error header and exits with code 2', () => {
      // Arrange
      const error = new Error('something broke');

      // Act
      run(() => handleError(error));

      // Assert
      expect(exitCode).toBe(ExitCode.UnexpectedError);
      expect(output()).toContain('Unexpected error');
      expect(output()).toContain('something broke');
    });

    test('prints truncated stack trace', () => {
      // Arrange
      const error = new Error('stack test');

      // Act
      run(() => handleError(error));

      // Assert
      expect(output()).toContain('at'); // stack frames contain "at <function>"
      expect(output()).toContain('handler.test.ts');
    });

    test('prints issue report URL', () => {
      // Arrange
      const error = new Error('boom');

      // Act
      run(() => handleError(error));

      // Assert
      expect(output()).toContain('Please report this issue');
      expect(output()).toContain('github.com');
    });
  });

  describe('non-Error path', () => {
    test('String-ifies a string value and exits with code 2', () => {
      // Arrange
      const value = 'raw string error';

      // Act
      run(() => handleError(value));

      // Assert
      expect(exitCode).toBe(ExitCode.UnexpectedError);
      expect(output()).toContain('raw string error');
    });

    test('String-ifies a number value and exits with code 2', () => {
      // Arrange
      const value = 42;

      // Act
      run(() => handleError(value));

      // Assert
      expect(exitCode).toBe(ExitCode.UnexpectedError);
      expect(output()).toContain('42');
    });
  });

  describe('Error without stack', () => {
    test('skips stack section when error has no stack', () => {
      // Arrange
      const error = new Error('no stack');
      delete error.stack;

      // Act
      run(() => handleError(error));

      // Assert
      expect(exitCode).toBe(ExitCode.UnexpectedError);
      expect(output()).toContain('no stack');
    });
  });
});

describe('safeRun', () => {
  let exitCode: number | undefined;
  let errors: string[];
  const originalExit = process.exit;
  const originalStderr = console.error;

  beforeEach(() => {
    exitCode = undefined;
    errors = [];
    process.exit = ((code?: number) => {
      exitCode = code ?? 0;
      throw new Error('__PROCESS_EXIT__');
    }) as typeof process.exit;
    console.error = (...args: unknown[]) => {
      errors.push(args.map(String).join(' '));
    };
  });

  afterEach(() => {
    process.exit = originalExit;
    console.error = originalStderr;
  });

  function output(): string {
    return errors.map(strip).join('\n');
  }

  test('resolves when fn succeeds', async () => {
    // Arrange
    let called = false;

    // Act
    await safeRun(async () => {
      called = true;
    });

    // Assert
    expect(called).toBe(true);
    expect(exitCode).toBeUndefined();
  });

  test('calls handleError when fn throws AppError', async () => {
    // Arrange
    const error = new CurlError('https://example.com');

    // Act
    try {
      await safeRun(async () => {
        throw error;
      });
    } catch (e) {
      if (!(e instanceof Error && e.message === '__PROCESS_EXIT__')) throw e;
    }

    // Assert
    expect(exitCode).toBe(1);
    expect(output()).toContain('Error fetching');
  });

  test('calls handleError when fn throws plain Error', async () => {
    // Arrange
    const error = new Error('unexpected');

    // Act
    try {
      await safeRun(async () => {
        throw error;
      });
    } catch (e) {
      if (!(e instanceof Error && e.message === '__PROCESS_EXIT__')) throw e;
    }

    // Assert
    expect(exitCode).toBe(ExitCode.UnexpectedError);
    expect(output()).toContain('unexpected');
  });
});
