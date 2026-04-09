import { FetchError } from '@seo-solver/fetch';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { CLIError, handleError } from '../../src/shared/error-handler.js';

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

  test('formats generic errors and sets exit code 2', () => {
    handleError(new Error('boom'));

    expect(process.exitCode).toBe(2);
    expect(errorSpy).toHaveBeenCalledWith('Unexpected error: boom');
  });
});
