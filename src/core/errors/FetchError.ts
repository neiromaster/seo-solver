import { RED, RESET, YELLOW } from '#lib/colors';
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
    this.userMessage = `${RED}Error fetching${RESET} ${url} (${fetchMethod})`;
  }

  getSuggestion(): string {
    return this.fetchMethod === 'playwright'
      ? `\n  ${RESET}Try ${YELLOW}--curl${RESET} flag to use SSR HTML fetching`
      : `\n  ${RESET}Try without ${YELLOW}--curl${RESET} flag to use browser`;
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
