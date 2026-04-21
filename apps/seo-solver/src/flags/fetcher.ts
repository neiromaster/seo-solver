import { number, option, optional, string } from 'cmd-ts';

export const fetcherFlag = option({
  long: 'fetcher',
  type: optional(string),
  description: 'Fetcher to use: native, playwright (default: native)',
});

export const timeoutFlag = option({
  long: 'timeout-ms',
  type: optional(number),
  description: 'Request timeout in ms (default: 30000)',
});

export const userAgentFlag = option({
  long: 'user-agent',
  type: optional(string),
  description: 'Custom User-Agent string',
});

export const retryFlag = option({
  long: 'retry-attempts',
  type: optional(number),
  description: 'Number of retry attempts (default: 1, no retry)',
});

export const retryDelayFlag = option({
  long: 'retry-delay-ms',
  type: optional(number),
  description: 'Delay between retry attempts in milliseconds',
});

export const retryBackoffFlag = option({
  long: 'retry-backoff',
  type: optional(string),
  description: 'Retry backoff strategy: fixed or exponential',
});

export const respectRetryAfterFlag = option({
  long: 'respect-retry-after',
  type: optional(string),
  description: 'Whether to respect Retry-After headers: true or false',
});

export type FetcherFlags = {
  fetcher: string | undefined;
  timeout: number | undefined;
  userAgent: string | undefined;
  retry: number | undefined;
  retryDelayMs: number | undefined;
  retryBackoff: string | undefined;
  respectRetryAfter: string | undefined;
};

export const fetcherFlags = {
  fetcher: fetcherFlag,
  timeout: timeoutFlag,
  userAgent: userAgentFlag,
  retry: retryFlag,
  retryDelayMs: retryDelayFlag,
  retryBackoff: retryBackoffFlag,
  respectRetryAfter: respectRetryAfterFlag,
};
