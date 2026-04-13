import { FetchError } from '@seo-solver/fetch';
import { ValidationError } from '@seo-solver/validate';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { CLIError, handleError } from '../../src/cli-support/error-handler';

describe('handleError', () => {
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

  afterEach(() => {
    process.exitCode = undefined;
    errorSpy.mockClear();
  });

  test('formats CLI errors and sets exit code 2', () => {
    handleError(new CLIError('bad flag'));

    expect(process.exitCode).toBe(2);
    expect(errorSpy).toHaveBeenCalledWith('Error: bad flag');
  });

  test('formats fetch errors and sets exit code 2', () => {
    handleError(new FetchError('timed out', 'https://example.com', 'TIMEOUT'));

    expect(process.exitCode).toBe(2);
    expect(errorSpy).toHaveBeenNthCalledWith(1, 'Fetch error (TIMEOUT): timed out');
    expect(errorSpy).toHaveBeenNthCalledWith(2, '  URL: https://example.com');
  });

  test('formats structural fetch errors with optional hints', () => {
    handleError({
      code: 'MISSING_RUNTIME_DEPENDENCY',
      message: 'Playwright runtime dependency is missing',
      retryable: false,
      backend: 'playwright',
      installHint: 'pnpm add playwright',
    });

    expect(process.exitCode).toBe(2);
    expect(errorSpy).toHaveBeenNthCalledWith(
      1,
      'Fetch error (MISSING_RUNTIME_DEPENDENCY): Playwright runtime dependency is missing',
    );
    expect(errorSpy).toHaveBeenNthCalledWith(2, '  Backend: playwright');
    expect(errorSpy).toHaveBeenNthCalledWith(3, '  Hint: pnpm add playwright');
  });

  test('formats generic errors and sets exit code 2', () => {
    handleError(new Error('boom'));

    expect(process.exitCode).toBe(2);
    expect(errorSpy).toHaveBeenCalledWith('Unexpected error: boom');
  });

  test('formats validation errors and sets exit code 2', () => {
    handleError(new ValidationError('Invalid severity override: broken', 'INVALID_SEVERITY_OVERRIDE', 'broken'));

    expect(process.exitCode).toBe(2);
    expect(errorSpy).toHaveBeenCalledWith('Error: Invalid severity override: broken');
  });
});
