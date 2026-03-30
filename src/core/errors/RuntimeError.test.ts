import { describe, expect, test } from 'bun:test';
import ansis from 'ansis';
import { PlaywrightRuntimeUnavailableError } from './RuntimeError';

function strip(str: string): string {
  return ansis.strip(str);
}

describe('PlaywrightRuntimeUnavailableError', () => {
  test('suggests --curl fallback', () => {
    const error = new PlaywrightRuntimeUnavailableError();

    expect(strip(error.format())).toContain('--curl');
  });

  test('does not include raw missing-runtime Playwright launch message', () => {
    const error = new PlaywrightRuntimeUnavailableError(
      new Error(
        `Executable doesn't exist at /tmp/playwright/chromium\nPlease run the following command to download new browsers:`,
      ),
    );

    expect(strip(error.format())).not.toContain("Executable doesn't exist at");
  });

  test('includes install failure cause when present', () => {
    const error = new PlaywrightRuntimeUnavailableError(new Error('installer failed'));

    expect(strip(error.format())).toContain('installer failed');
  });
});
