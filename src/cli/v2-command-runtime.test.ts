import { afterEach, beforeEach, expect, mock, test } from 'bun:test';
import type { RenderResultPresenter } from '#cli/presenters';
import { AppError as LegacyAppError } from '#core/errors/AppError';

class TestLegacyError extends LegacyAppError {
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

const { ensureEditorAvailable, presentV2Result, resolveV2FetcherOption, safeRunV2 } = await import(
  './v2-command-runtime'
);

test('resolveV2FetcherOption maps basic to basic', () => {
  expect(resolveV2FetcherOption({ curl: false, fetcher: 'basic' })).toEqual({ fetcherId: 'basic' });
});

test('resolveV2FetcherOption maps chrome to browser', () => {
  expect(resolveV2FetcherOption({ curl: false, fetcher: 'chrome' })).toEqual({
    fetcherId: 'browser',
    warning: undefined,
  });
});

test('resolveV2FetcherOption rejects curl on V2 path', () => {
  expect(() => resolveV2FetcherOption({ curl: false, fetcher: 'curl' })).toThrow(
    'The curl fetcher is not supported on the V2 CLI path yet.',
  );
});

test('presentV2Result forwards exit code from presenter', async () => {
  const presenter: RenderResultPresenter = { present: mock(async () => 7) };
  await presentV2Result(presenter, { kind: 'text', content: 'hello' });
  expect(process.exitCode).toBe(7);
});

test('safeRunV2 delegates legacy app errors to cli error handler', async () => {
  await expect(
    safeRunV2(async () => {
      throw new TestLegacyError('legacy failure');
    }),
  ).rejects.toThrow('exit:1');
});

test('ensureEditorAvailable resolves when editor is not provided', async () => {
  await expect(ensureEditorAvailable(undefined)).resolves.toBeUndefined();
});
