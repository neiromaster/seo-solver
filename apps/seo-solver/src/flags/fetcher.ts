import { number, option, optional, string } from 'cmd-ts';

export const fetcherFlag = option({
  long: 'fetcher',
  type: optional(string),
  description: 'Fetcher to use: native, playwright (default: native)',
});

export const timeoutFlag = option({
  long: 'timeout',
  type: optional(number),
  description: 'Request timeout in ms (default: 30000)',
});

export const userAgentFlag = option({
  long: 'user-agent',
  type: optional(string),
  description: 'Custom User-Agent string',
});

export const retryFlag = option({
  long: 'retry',
  type: optional(number),
  description: 'Number of retry attempts (default: 1, no retry)',
});

export type FetcherFlags = {
  fetcher: string | undefined;
  timeout: number | undefined;
  userAgent: string | undefined;
  retry: number | undefined;
};

export const fetcherFlags = {
  fetcher: fetcherFlag,
  timeout: timeoutFlag,
  userAgent: userAgentFlag,
  retry: retryFlag,
};
