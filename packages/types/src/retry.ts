export type RetryOptions = {
  attempts?: number;
  delay?: number;
  backoff?: 'fixed' | 'exponential';
  retryOn?: number[];
  respectRetryAfter?: boolean;
};
