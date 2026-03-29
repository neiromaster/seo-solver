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
    this.userMessage = `Error fetching ${url} (${fetchMethod})`;
  }

  private getSuggestion(): string {
    return this.fetchMethod === 'playwright'
      ? `\n  Try ${yellow`--curl`} flag to use raw HTML fetching`
      : `\n  Try without ${yellow`--curl`} flag to use browser`;
  }

  override format(): string {
    let output = `${red('Error fetching')} ${this.url} (${this.fetchMethod})`;
    if (this.cause instanceof Error && this.cause.message !== this.message) {
      output += `\n\n  ${this.cause.message}`;
    }
    output += this.getSuggestion();
    return output;
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
