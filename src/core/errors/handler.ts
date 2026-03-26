import { BOLD, CYAN, DIM, RED, RESET, YELLOW } from '#lib/colors';
import type { AppError } from './AppError';

export enum ExitCode {
  Success = 0,
  ExpectedError = 1,
  UnexpectedError = 2,
}

export function handleError(error: unknown): never {
  console.error(`\n${RED}${BOLD}❌ Error${RESET}\n`);

  if (error instanceof Error && 'exitCode' in error && 'format' in error) {
    const appError = error as AppError;
    console.error(appError.format());
    console.error();
    process.exit(appError.exitCode);
  }

  console.error(`${RED}${BOLD}Unexpected error:${RESET}`);
  console.error(`${DIM}${error instanceof Error ? error.message : String(error)}${RESET}\n`);

  if (error instanceof Error && error.stack) {
    const stack = error.stack.split('\n').slice(1, 4).join('\n');
    console.error(`${DIM}${stack}${RESET}\n`);
  }

  console.error(`${YELLOW}Please report this issue:${RESET}`);
  console.error(`  ${CYAN}https://github.com/neiromaster/schema-diff/issues${RESET}\n`);

  process.exit(ExitCode.UnexpectedError);
}

export async function safeRun(fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (error) {
    handleError(error);
  }
}
