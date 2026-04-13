import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { FetchError } from './errors';
import { withRetry } from './retry';

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('returns on first success', async () => {
    const fn = vi.fn(async () => ({ statusCode: 200 }));
    const promise = withRetry(fn, (_, result) => result?.statusCode === 500, baseOptions());
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toEqual({ attempts: 1, result: { statusCode: 200 } });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('retries until success', async () => {
    const fn = vi
      .fn<() => Promise<{ statusCode: number }>>()
      .mockResolvedValueOnce({ statusCode: 500 })
      .mockResolvedValueOnce({ statusCode: 200 });

    const promise = withRetry(fn, (_, result) => result?.statusCode === 500, baseOptions());
    await vi.runAllTimersAsync();

    await expect(promise).resolves.toEqual({ attempts: 2, result: { statusCode: 200 } });
  });

  test('returns last retryable result when attempts are exhausted', async () => {
    const fn = vi.fn(async () => ({ statusCode: 429, headers: { 'retry-after': '1' } }));
    const promise = withRetry(fn, (_, result) => result?.statusCode === 429, { ...baseOptions(), attempts: 2 });
    await vi.runAllTimersAsync();

    await expect(promise).resolves.toEqual({
      attempts: 2,
      result: { headers: { 'retry-after': '1' }, statusCode: 429 },
    });
  });

  test('treats attempts lower than one as one', async () => {
    const fn = vi.fn(async () => {
      throw new FetchError('network', 'https://x.com', 'NETWORK');
    });

    const promise = withRetry(fn, () => true, { ...baseOptions(), attempts: 0 });
    const expectation = expect(promise).rejects.toMatchObject({ code: 'NETWORK' });
    await vi.runAllTimersAsync();
    await expectation;
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('uses fixed delays', async () => {
    const fn = vi
      .fn<() => Promise<{ statusCode: number }>>()
      .mockResolvedValueOnce({ statusCode: 500 })
      .mockResolvedValueOnce({ statusCode: 500 })
      .mockResolvedValueOnce({ statusCode: 200 });

    const promise = withRetry(fn, (_, result) => result?.statusCode === 500, {
      ...baseOptions(),
      attempts: 3,
      delay: 100,
    });
    await vi.advanceTimersByTimeAsync(199);
    expect(fn).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toEqual({ attempts: 3, result: { statusCode: 200 } });
  });

  test('uses exponential backoff', async () => {
    const fn = vi
      .fn<() => Promise<{ statusCode: number }>>()
      .mockResolvedValueOnce({ statusCode: 500 })
      .mockResolvedValueOnce({ statusCode: 500 })
      .mockResolvedValueOnce({ statusCode: 200 });

    const promise = withRetry(fn, (_, result) => result?.statusCode === 500, {
      ...baseOptions(),
      attempts: 3,
      backoff: 'exponential',
      delay: 100,
    });

    await vi.advanceTimersByTimeAsync(99);
    expect(fn).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(fn).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(199);
    expect(fn).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    await vi.runAllTimersAsync();

    await expect(promise).resolves.toEqual({ attempts: 3, result: { statusCode: 200 } });
  });

  test('uses numeric retry-after header', async () => {
    const fn = vi
      .fn<() => Promise<{ headers?: Record<string, string>; statusCode: number }>>()
      .mockResolvedValueOnce({ headers: { 'retry-after': '2' }, statusCode: 429 })
      .mockResolvedValueOnce({ statusCode: 200 });

    const promise = withRetry(fn, (_, result) => result?.statusCode === 429, baseOptions());
    await vi.advanceTimersByTimeAsync(1999);
    expect(fn).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toEqual({ attempts: 2, result: { statusCode: 200 } });
  });

  test('uses http-date retry-after header', async () => {
    const fn = vi
      .fn<() => Promise<{ headers?: Record<string, string>; statusCode: number }>>()
      .mockResolvedValueOnce({ headers: { 'retry-after': 'Thu, 01 Jan 2026 00:00:01 GMT' }, statusCode: 429 })
      .mockResolvedValueOnce({ statusCode: 200 });

    const promise = withRetry(fn, (_, result) => result?.statusCode === 429, { ...baseOptions(), delay: 100 });
    await vi.advanceTimersByTimeAsync(999);
    expect(fn).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toEqual({ attempts: 2, result: { statusCode: 200 } });
  });

  test('ignores huge retry-after values', async () => {
    const fn = vi
      .fn<() => Promise<{ headers?: Record<string, string>; statusCode: number }>>()
      .mockResolvedValueOnce({ headers: { 'retry-after': '120' }, statusCode: 429 })
      .mockResolvedValueOnce({ statusCode: 200 });

    const promise = withRetry(fn, (_, result) => result?.statusCode === 429, { ...baseOptions(), delay: 100 });
    await vi.advanceTimersByTimeAsync(99);
    expect(fn).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toEqual({ attempts: 2, result: { statusCode: 200 } });
  });

  test('aborts during retry delay', async () => {
    const controller = new AbortController();
    const fn = vi.fn(async () => ({ statusCode: 500 }));
    const promise = withRetry(fn, (_, result) => result?.statusCode === 500, baseOptions(), controller.signal);
    const expectation = expect(promise).rejects.toMatchObject({ code: 'ABORTED' });

    controller.abort(new Error('stop'));
    await vi.runAllTimersAsync();

    await expectation;
  });

  test('does not retry on non-matching status', async () => {
    const fn = vi.fn(async () => ({ statusCode: 500 }));
    const promise = withRetry(fn, (_, result) => result?.statusCode === 429, baseOptions());
    await vi.runAllTimersAsync();

    await expect(promise).resolves.toEqual({ attempts: 1, result: { statusCode: 500 } });
  });

  test('retries on errors when predicate matches', async () => {
    const fn = vi
      .fn<() => Promise<{ statusCode: number }>>()
      .mockRejectedValueOnce(new FetchError('network', 'https://x.com', 'NETWORK'))
      .mockResolvedValueOnce({ statusCode: 200 });

    const promise = withRetry(fn, (error) => error instanceof FetchError && error.code === 'NETWORK', baseOptions());
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toEqual({ attempts: 2, result: { statusCode: 200 } });
  });

  test('ignores retry-after when disabled', async () => {
    const fn = vi
      .fn<() => Promise<{ headers?: Record<string, string>; statusCode: number }>>()
      .mockResolvedValueOnce({ headers: { 'retry-after': '2' }, statusCode: 429 })
      .mockResolvedValueOnce({ statusCode: 200 });

    const promise = withRetry(fn, (_, result) => result?.statusCode === 429, {
      ...baseOptions(),
      delay: 100,
      respectRetryAfter: false,
    });

    await vi.advanceTimersByTimeAsync(99);
    expect(fn).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toEqual({ attempts: 2, result: { statusCode: 200 } });
  });
});

function baseOptions() {
  return {
    attempts: 2,
    backoff: 'fixed' as const,
    delay: 1000,
    respectRetryAfter: true,
  };
}
