import { cyan, dim, red, underline, yellow } from 'ansis';
import pkg from '../../../package.json';
import { AppError } from './AppError';

const bugsUrl: string = pkg.bugs.url;

export enum ExitCode {
  Success = 0,
  ExpectedError = 1,
  UnexpectedError = 2,
}

export function handleError(error: unknown): never {
  console.error(`\n${red.bold`❌ Error`}\n`);

  if (error instanceof AppError) {
    console.error(error.format());
    console.error();
    process.exit(error.exitCode);
  }

  console.error(red.bold`Unexpected error:`);
  console.error(`${dim(error instanceof Error ? error.message : String(error))}\n`);

  if (error instanceof Error && error.stack) {
    const stack = error.stack.split('\n').slice(1, 4).join('\n');
    console.error(`${dim(stack)}\n`);
  }

  console.error(yellow`Please report this issue:`);
  console.error(`  ${underline(cyan(bugsUrl))}\n`);

  process.exit(ExitCode.UnexpectedError);
}

export async function safeRun(fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (error) {
    handleError(error);
  }
}
