import { afterEach, beforeEach, expect, mock, test } from 'bun:test';
import type { RenderResultPresenter } from '#cli/presenters';
import { CliError } from './command-runtime';

class TestLegacyError extends CliError {
  readonly exitCode = 1;
  readonly userMessage = 'legacy failure';
}

const originalExit = process.exit;
const originalError = console.error;

beforeEach(() => {
  console.error = mock(() => undefined) as typeof console.error;
  process.exit = ((code?: number) => {
    throw new Error(`exit:${code ?? 0}`);
  }) as unknown as typeof process.exit;
});

afterEach(() => {
  console.error = originalError;
  process.exit = originalExit;
  mock.restore();
});

const { ensureEditorAvailable, presentResult, resolveFetcherOption, safeRun } = await import('./command-runtime');

test('resolveFetcherOption maps basic to basic', () => {
  expect(resolveFetcherOption({ fetcher: 'basic' })).toEqual({ fetcherId: 'basic' });
});

test('resolveFetcherOption maps chrome to browser', () => {
  expect(resolveFetcherOption({ fetcher: 'chrome' })).toEqual({
    fetcherId: 'browser',
    warning: undefined,
  });
});

test('resolveFetcherOption rejects unsupported fetchers on current path', () => {
  expect(() => resolveFetcherOption({ fetcher: 'curl' })).toThrow(
    'Invalid value for --fetcher: curl. Allowed values on the current CLI path: basic, chrome.',
  );
});

test('presentResult forwards exit code from presenter', async () => {
  const presenter: RenderResultPresenter = { present: mock(async () => 7) };
  await presentResult(presenter, { kind: 'text', content: 'hello' });
  expect(process.exitCode).toBe(7);
});

test('safeRun delegates legacy app errors to cli error handler', async () => {
  await expect(
    safeRun(async () => {
      throw new TestLegacyError('legacy failure');
    }),
  ).rejects.toThrow('exit:1');
});

test('ensureEditorAvailable resolves when editor is not provided', async () => {
  await expect(ensureEditorAvailable(undefined)).resolves.toBeUndefined();
});
