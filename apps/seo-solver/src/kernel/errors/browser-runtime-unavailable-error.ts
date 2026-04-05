import { AppError } from './app-error';

export class BrowserRuntimeUnavailableError extends AppError {
  constructor(cause?: unknown) {
    super('Browser runtime is unavailable', cause === undefined ? undefined : { cause });
    this.name = 'BrowserRuntimeUnavailableError';
  }
}
