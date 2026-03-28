import { red, yellow } from 'ansis';
import { AppError } from './AppError';

export class FetchError extends AppError {
  readonly exitCode = 1;
  readonly userMessage: string;

  constructor(
    message: string,
    public readonly url: string,
    public readonly fetchMethod: 'curl' | 'playwright',
    cause?: unknown,
  ) {
    super(message, cause);
    this.userMessage = `${red`Error fetching`} ${url} (${fetchMethod})`;
  }

  getSuggestion(): string {
    return this.fetchMethod === 'playwright'
      ? `\n  Try ${yellow`--curl`} flag to use SSR HTML fetching`
      : `\n  Try without ${yellow`--curl`} flag to use browser`;
  }

  override format(): string {
    return `${super.format()}${this.getSuggestion()}`;
  }
}

export class CurlError extends FetchError {
  constructor(url: string, cause?: unknown) {
    super('curl execution failed', url, 'curl', cause);
  }
}

export class PlaywrightError extends FetchError {
  constructor(url: string, cause?: unknown) {
    super('browser operation failed', url, 'playwright', cause);
  }
}
