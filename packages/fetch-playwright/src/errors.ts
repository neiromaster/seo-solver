import type { FetchErrorCode, FetchErrorLike } from '@seo-solver/types/fetch';

type FetchErrorDetails = {
  backend?: string;
  installHint?: string;
  retryable?: boolean;
  url?: string;
};

export class FetchError extends Error implements FetchErrorLike {
  readonly code: FetchErrorCode;
  readonly url?: string;
  readonly retryable: boolean;
  readonly backend?: string;
  readonly installHint?: string;

  constructor(
    message: string,
    url: string | undefined,
    code: FetchErrorCode,
    options?: ErrorOptions,
    details: FetchErrorDetails = {},
  ) {
    super(message, options);
    this.name = 'FetchError';
    this.url = details.url ?? url;
    this.code = code;
    this.retryable = details.retryable ?? isRetryableFetchError(code);
    this.backend = details.backend;
    this.installHint = details.installHint;
  }
}

function isRetryableFetchError(code: FetchErrorCode): boolean {
  return code === 'NETWORK' || code === 'NETWORK_ERROR' || code === 'TIMEOUT';
}
