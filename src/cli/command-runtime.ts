import { cyan, dim, red, underline, yellow } from 'ansis';
import { createEditorLauncher } from '#adapters/editor';
import type { RenderResultPresenter } from '#cli/presenters';
import { AppError } from '#kernel';
import pkg from '../../package.json' with { type: 'json' };

const bugsUrl: string = pkg.bugs.url;

export abstract class CliError extends Error {
  abstract readonly exitCode: number;
  abstract readonly userMessage: string;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }

  format(): string {
    let output = this.userMessage;
    if (this.cause instanceof Error && this.cause.message !== this.message) {
      output += `\n\n  ${this.cause.message}`;
    }
    return output;
  }
}

class UsageError extends CliError {
  readonly exitCode = 1;
  readonly userMessage: string;

  constructor(message: string) {
    super(message);
    this.userMessage = message;
  }
}

export type FetcherResolution = {
  fetcherId: 'basic' | 'browser';
  warning?: string;
};

export function resolveFetcherOption(input: { fetcher?: string }): FetcherResolution {
  const rawValue = input.fetcher ?? 'basic';

  if (rawValue === 'basic') {
    return { fetcherId: 'basic' };
  }

  if (rawValue === 'chrome' || rawValue.startsWith('chrome:')) {
    return {
      fetcherId: 'browser',
      warning: rawValue.startsWith('chrome:')
        ? 'Warning: remote chrome targets are not supported on the current CLI path yet. Falling back to local browser launch.'
        : undefined,
    };
  }

  throw new UsageError(
    `Invalid value for --fetcher: ${rawValue}. Allowed values on the current CLI path: basic, chrome.`,
  );
}

export async function presentResult(
  presenter: RenderResultPresenter,
  result: Parameters<RenderResultPresenter['present']>[0],
  options?: { editor?: string },
): Promise<void> {
  process.exitCode = await presenter.present(result, options);
}

export async function safeRun(fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (error) {
    handleCliError(error);
  }
}

export async function ensureEditorAvailable(editor?: string): Promise<void> {
  if (!editor) {
    return;
  }

  await createEditorLauncher().ensureAvailable(editor);
}

function handleCliError(error: unknown): never {
  if (error instanceof CliError) {
    if (error.exitCode > 0) {
      console.error(`\n${red.bold`❌ Error`}\n`);
    }
    console.error(error.format());
    console.error();
    process.exit(error.exitCode);
  }

  if (error instanceof AppError) {
    console.error(`\n${red.bold`❌ Error`}\n`);
    console.error(error.message);
    console.error();
    process.exit(1);
  }

  console.error(red.bold`Unexpected error:`);
  console.error(`${dim(error instanceof Error ? error.message : String(error))}\n`);

  if (error instanceof Error && error.stack) {
    const stack = error.stack.split('\n').slice(1, 4).join('\n');
    console.error(`${dim(stack)}\n`);
  }

  console.error(yellow`Please report this issue:`);
  console.error(`  ${underline(cyan(bugsUrl))}\n`);
  process.exit(2);
}
