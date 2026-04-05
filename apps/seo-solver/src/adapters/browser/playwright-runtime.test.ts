import type { Browser } from 'playwright';
import { BrowserRuntimeUnavailableError } from '#kernel';
import { describe, expect, mock, test } from '#test-support/test-runtime';
import { isMissingPlaywrightRuntimeError, launchBrowserWithRuntimePrompt } from './playwright-runtime';

function createMissingRuntimeError(): Error {
  return new Error(
    `Executable doesn't exist at /tmp/playwright/chromium\nPlease run the following command to download new browsers:`,
  );
}

function createWrappedMissingRuntimeError(): Error {
  return new Error('failed to launch browser', { cause: createMissingRuntimeError() });
}

describe('isMissingPlaywrightRuntimeError', () => {
  test('returns true for missing runtime launch errors', () => {
    expect(isMissingPlaywrightRuntimeError(createMissingRuntimeError())).toBe(true);
  });

  test('returns false for unrelated launch errors', () => {
    expect(isMissingPlaywrightRuntimeError(new Error('navigation timeout'))).toBe(false);
  });

  test('returns true for wrapped missing runtime launch errors', () => {
    expect(isMissingPlaywrightRuntimeError(createWrappedMissingRuntimeError())).toBe(true);
  });
});

describe('launchBrowserWithRuntimePrompt', () => {
  test('returns browser immediately when runtime is available', async () => {
    const browser = {} as Browser;
    const launchBrowser = mock(async () => browser);
    const confirmInstall = mock(async () => true);
    const installRuntime = mock(async () => undefined);

    const result = await launchBrowserWithRuntimePrompt({
      launchBrowser,
      confirmInstall,
      installRuntime,
      isInteractive: () => true,
    });

    expect(result).toBe(browser);
    expect(confirmInstall).not.toHaveBeenCalled();
    expect(installRuntime).not.toHaveBeenCalled();
  });

  test('prompts and installs runtime when missing in interactive mode and user agrees', async () => {
    const browser = {} as Browser;
    const launchBrowser = mock(async () => browser)
      .mockRejectedValueOnce(createMissingRuntimeError())
      .mockResolvedValueOnce(browser);
    const confirmInstall = mock(async () => true);
    const installRuntime = mock(async () => undefined);

    const result = await launchBrowserWithRuntimePrompt({
      launchBrowser,
      confirmInstall,
      installRuntime,
      isInteractive: () => true,
    });

    expect(result).toBe(browser);
    expect(confirmInstall).toHaveBeenCalledTimes(1);
    expect(installRuntime).toHaveBeenCalledTimes(1);
    expect(launchBrowser).toHaveBeenCalledTimes(2);
  });

  test('throws browser runtime error when user declines install', async () => {
    const launchBrowser = mock(async () => {
      throw createMissingRuntimeError();
    });
    const confirmInstall = mock(async () => false);
    const installRuntime = mock(async () => undefined);

    await expect(
      launchBrowserWithRuntimePrompt({
        launchBrowser,
        confirmInstall,
        installRuntime,
        isInteractive: () => true,
      }),
    ).rejects.toBeInstanceOf(BrowserRuntimeUnavailableError);
  });

  test('throws browser runtime error without prompting in non-interactive mode', async () => {
    const launchBrowser = mock(async () => {
      throw createMissingRuntimeError();
    });
    const confirmInstall = mock(async () => true);
    const installRuntime = mock(async () => undefined);

    await expect(
      launchBrowserWithRuntimePrompt({
        launchBrowser,
        confirmInstall,
        installRuntime,
        isInteractive: () => false,
      }),
    ).rejects.toBeInstanceOf(BrowserRuntimeUnavailableError);
  });

  test('treats wrapped missing runtime errors as installable', async () => {
    const browser = {} as Browser;
    const launchBrowser = mock(async () => browser)
      .mockRejectedValueOnce(createWrappedMissingRuntimeError())
      .mockResolvedValueOnce(browser);
    const confirmInstall = mock(async () => true);
    const installRuntime = mock(async () => undefined);

    const result = await launchBrowserWithRuntimePrompt({
      launchBrowser,
      confirmInstall,
      installRuntime,
      isInteractive: () => true,
    });

    expect(result).toBe(browser);
    expect(confirmInstall).toHaveBeenCalledTimes(1);
    expect(installRuntime).toHaveBeenCalledTimes(1);
  });
});
