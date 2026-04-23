import { FetchError } from './errors.js';

type RetryResult = {
  headers?: Record<string, string>;
  statusCode?: number;
};

type RetryPredicate<T> = (error: unknown, result?: T) => boolean;

export async function withRetry<T extends RetryResult>(
  fn: () => Promise<T>,
  shouldRetry: RetryPredicate<T>,
  options: {
    attempts: number;
    backoff: 'fixed' | 'exponential';
    delay: number;
    respectRetryAfter: boolean;
  },
  signal?: AbortSignal,
): Promise<{ attempts: number; result: T }> {
  const maxAttempts = Math.max(1, options.attempts);
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      // biome-ignore lint/performance/noAwaitInLoops: retries must be sequential
      const result = await fn();
      if (!shouldRetry(undefined, result) || attempt === maxAttempts) {
        return { attempts: attempt, result };
      }

      await sleep(resolveDelay(result.headers, attempt, options), signal);
    } catch (error) {
      if (!shouldRetry(error) || attempt === maxAttempts) {
        throw error;
      }

      lastError = error;
      await sleep(resolveDelay(undefined, attempt, options), signal);
    }
  }

  throw lastError;
}

function resolveDelay(
  headers: Record<string, string> | undefined,
  attempt: number,
  options: {
    backoff: 'fixed' | 'exponential';
    delay: number;
    respectRetryAfter: boolean;
  },
): number {
  const retryAfterDelay = options.respectRetryAfter ? parseRetryAfter(headers?.['retry-after']) : null;
  if (retryAfterDelay !== null) {
    return retryAfterDelay;
  }

  if (options.backoff === 'exponential') {
    return options.delay * 2 ** (attempt - 1);
  }

  return options.delay;
}

function parseRetryAfter(value?: string): number | null {
  if (!value) {
    return null;
  }

  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    const milliseconds = numeric * 1000;
    return milliseconds <= 60_000 ? milliseconds : null;
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return null;
  }

  const milliseconds = Math.max(0, timestamp - Date.now());
  return milliseconds <= 60_000 ? milliseconds : null;
}

async function sleep(delay: number, signal?: AbortSignal): Promise<void> {
  if (delay <= 0) {
    if (signal?.aborted) {
      throw abortError(signal);
    }

    return;
  }

  if (signal?.aborted) {
    throw abortError(signal);
  }

  await new Promise<void>((resolve, reject) => {
    const activeSignal = signal;
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, delay);

    const onAbort = () => {
      clearTimeout(timer);
      cleanup();
      if (activeSignal) {
        reject(abortError(activeSignal));
      }
    };

    const cleanup = () => {
      activeSignal?.removeEventListener('abort', onAbort);
    };

    if (activeSignal) {
      activeSignal.addEventListener('abort', onAbort, { once: true });
    }
  });
}

function abortError(signal: AbortSignal): FetchError {
  return new FetchError('Retry aborted', 'retry', 'ABORTED', {
    cause: signal.reason,
  });
}
