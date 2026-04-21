export type RetryOptions = {
  attempts?: number | undefined;
  delay?: number | undefined;
  backoff?: 'fixed' | 'exponential' | undefined;
  retryOn?: number[] | undefined;
  respectRetryAfter?: boolean | undefined;
};
