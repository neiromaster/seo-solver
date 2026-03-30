import { red, yellow } from 'ansis';
import { AppError } from './AppError';

export class FetchError extends AppError {
  readonly exitCode = 1;
  readonly userMessage: string;

  constructor(
    message: string,
    public readonly url: string,
    public readonly fetchMethod: 'basic' | 'curl' | 'playwright',
    cause?: unknown,
  ) {
    super(message, cause);
    this.userMessage = `Error fetching ${url} (${fetchMethod})`;
  }

  private getSuggestion(): string {
    if (this.fetchMethod === 'playwright') {
      return `\n  Try ${yellow`--fetcher curl`} to use raw HTML fetching`;
    }

    if (this.fetchMethod === 'curl') {
      return `\n  Try ${yellow`--fetcher chrome`} to use browser fetching`;
    }

    return `\n  Try ${yellow`--fetcher chrome`} or ${yellow`--fetcher curl`} to use an alternate fetcher`;
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
