import { UsageError } from '#core/errors';
import type { FetcherConfig } from '#core/services/fetcher-config';

export const CURL_DEPRECATION_WARNING =
  'Warning: -c is deprecated and will be removed in a future release. Use --fetcher curl instead.';

const FETCHER_VALUE_ERROR = 'Allowed values: basic, curl, chrome, chrome:<port|host:port|url>';

const CHROME_TARGET_ERROR = 'Expected one of: chrome, chrome:<port>, chrome:<host:port>, chrome:<url>';

export type ResolveFetcherCliInput = {
  curl: boolean;
  fetcher?: string;
};

export type ResolveFetcherResult = {
  fetcher: FetcherConfig;
  warning?: string;
};

export function resolveFetcherOption(input: ResolveFetcherCliInput): ResolveFetcherResult {
  const rawValue = input.fetcher ?? (input.curl ? 'curl' : 'basic');

  return {
    fetcher: parseFetcherValue(rawValue),
    warning: input.curl ? CURL_DEPRECATION_WARNING : undefined,
  };
}

function parseFetcherValue(value: string): FetcherConfig {
  if (value === 'basic') {
    return { type: 'basic' };
  }

  if (value === 'curl') {
    return { type: 'curl' };
  }

  if (value === 'chrome') {
    return { type: 'chrome', mode: 'launch' };
  }

  if (value.startsWith('chrome:')) {
    return {
      type: 'chrome',
      mode: 'connect',
      target: normalizeChromeTarget(value),
    };
  }

  throw new UsageError(`Invalid value for --fetcher: ${value}.\n${FETCHER_VALUE_ERROR}`);
}

function normalizeChromeTarget(value: string): string {
  const target = value.slice('chrome:'.length);

  if (target.length === 0) {
    throw new UsageError(`Invalid chrome fetcher target: ${value}.\n${CHROME_TARGET_ERROR}`);
  }

  if (/^\d+$/.test(target)) {
    return `localhost:${target}`;
  }

  if (/^[a-zA-Z0-9.-]+:\d+$/.test(target)) {
    return target;
  }

  if (isHttpUrl(target)) {
    return target;
  }

  throw new UsageError(`Invalid chrome fetcher target: ${value}.\n${CHROME_TARGET_ERROR}`);
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.host.length > 0;
  } catch {
    return false;
  }
}
