import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline/promises';
import type { Browser } from 'playwright';
import { PlaywrightRuntimeUnavailableError } from '#core/errors';

const require = createRequire(import.meta.url);

export const PLAYWRIGHT_RUNTIME_MISSING_MARKERS = [
  "Executable doesn't exist at",
  'Please run the following command to download',
  'No chromium-based browser found on the system.',
] as const;

export type PlaywrightRuntimeDeps = {
  launchBrowser: () => Promise<Browser>;
  installRuntime: () => Promise<void>;
  confirmInstall: () => Promise<boolean>;
  isInteractive: () => boolean;
};

const defaultPlaywrightRuntimeDeps: PlaywrightRuntimeDeps = {
  launchBrowser: () => {
    throw new Error('launchBrowser is required');
  },
  installRuntime: installChromiumRuntime,
  confirmInstall: confirmChromiumRuntimeInstall,
  isInteractive: isInteractiveTerminal,
};

export async function launchBrowserWithRuntimePrompt(deps: PlaywrightRuntimeDeps): Promise<Browser> {
  try {
    return await deps.launchBrowser();
  } catch (error) {
    if (!isMissingPlaywrightRuntimeError(error)) {
      throw error;
    }

    if (!deps.isInteractive()) {
      throw new PlaywrightRuntimeUnavailableError();
    }

    let shouldInstall = false;
    try {
      shouldInstall = await deps.confirmInstall();
    } catch (promptError) {
      throw new PlaywrightRuntimeUnavailableError(promptError);
    }

    if (!shouldInstall) {
      throw new PlaywrightRuntimeUnavailableError();
    }

    try {
      await deps.installRuntime();
    } catch (installError) {
      throw new PlaywrightRuntimeUnavailableError(installError);
    }

    try {
      return await deps.launchBrowser();
    } catch (retryError) {
      if (isMissingPlaywrightRuntimeError(retryError)) {
        throw new PlaywrightRuntimeUnavailableError();
      }

      throw retryError;
    }
  }
}

export async function launchDefaultBrowserWithRuntimePrompt(
  launchBrowser: () => Promise<Browser>,
  deps: Partial<PlaywrightRuntimeDeps> = {},
): Promise<Browser> {
  return launchBrowserWithRuntimePrompt({
    ...defaultPlaywrightRuntimeDeps,
    ...deps,
    launchBrowser,
  });
}

export function isMissingPlaywrightRuntimeError(error: unknown): error is Error {
  let current: unknown = error;

  while (current instanceof Error) {
    const { message, cause } = current;

    if (PLAYWRIGHT_RUNTIME_MISSING_MARKERS.some((marker) => message.includes(marker))) {
      return true;
    }

    current = cause;
  }

  return false;
}

export function isInteractiveTerminal(): boolean {
  return Boolean(stdin.isTTY && stdout.isTTY);
}

export async function confirmChromiumRuntimeInstall(): Promise<boolean> {
  const rl = createInterface({ input: stdin, output: stdout });

  try {
    const answer = await rl.question('Playwright runtime is not installed. Install Chromium runtime now? [y/N] ');
    const normalized = answer.trim().toLowerCase();
    return normalized === 'y' || normalized === 'yes';
  } finally {
    rl.close();
  }
}

export async function installChromiumRuntime(): Promise<void> {
  stdout.write('\nInstalling Chromium runtime for Playwright...\n\n');

  const playwrightCliPath = join(dirname(require.resolve('playwright/package.json')), 'cli.js');

  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, [playwrightCliPath, 'install', 'chromium'], {
      stdio: 'inherit',
    });

    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Playwright runtime installation failed with exit code ${code ?? 'unknown'}`));
    });
  });
}
