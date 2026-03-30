import { yellow } from 'ansis';
import { PLAYWRIGHT_RUNTIME_MISSING_MARKERS } from '#core/services/playwright-runtime';
import { AppError } from './AppError';

function shouldShowCause(cause: unknown): cause is Error {
  return cause instanceof Error && !PLAYWRIGHT_RUNTIME_MISSING_MARKERS.some((marker) => cause.message.includes(marker));
}

export class PlaywrightRuntimeUnavailableError extends AppError {
  readonly exitCode = 1;
  readonly userMessage = 'Playwright Chromium runtime is not installed.';

  constructor(cause?: unknown) {
    super('playwright chromium runtime unavailable', cause);
  }

  override format(): string {
    let output = this.userMessage;

    if (shouldShowCause(this.cause)) {
      output += `\n\n  ${this.cause.message}`;
    }

    output += `\n\n  Try ${yellow`--fetcher curl`} to use raw HTML fetching`;
    return output;
  }
}
