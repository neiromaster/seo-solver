import { FetchError } from '@seo-solver/fetch';

export class CLIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CLIError';
  }
}

export function handleError(error: unknown): void {
  if (error instanceof CLIError) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 2;
    return;
  }

  if (error instanceof FetchError) {
    console.error(`Fetch error (${error.code}): ${error.message}`);
    console.error(`  URL: ${error.url}`);
    process.exitCode = 2;
    return;
  }

  if (error instanceof Error) {
    console.error(`Unexpected error: ${error.message}`);

    if (process.env.DEBUG) {
      console.error(error.stack);
    }

    process.exitCode = 2;
    return;
  }

  console.error('Unknown error:', error);
  process.exitCode = 2;
}
