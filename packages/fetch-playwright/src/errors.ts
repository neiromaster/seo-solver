export type FetchErrorCode = 'TIMEOUT' | 'ABORTED' | 'NETWORK' | 'TOO_MANY_REDIRECTS' | 'INVALID_URL';

export class FetchError extends Error {
  readonly code: FetchErrorCode;
  readonly url: string;

  constructor(message: string, url: string, code: FetchErrorCode, options?: ErrorOptions) {
    super(message, options);
    this.name = 'FetchError';
    this.url = url;
    this.code = code;
  }
}
