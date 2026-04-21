import type { FetchErrorCode, FetchErrorLike } from '@seo-solver/types/fetch';

type FetchErrorDetails = {
  backend?: string | undefined;
  installHint?: string | undefined;
  retryable?: boolean | undefined;
  url?: string | undefined;
};

export class FetchError extends Error implements FetchErrorLike {
  readonly code: FetchErrorCode;
  readonly url?: string | undefined;
  readonly retryable: boolean;
  readonly backend?: string | undefined;
  readonly installHint?: string | undefined;

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
