import type { Browser, BrowserType } from 'playwright';
import { chromium } from 'playwright';

export type PlaywrightBrowserClient = {
  launch(): Promise<Browser>;
  connect(target: string): Promise<Browser>;
};

export type PlaywrightBrowserClientDeps = {
  chromiumType: Pick<BrowserType<Browser>, 'launch' | 'connectOverCDP'>;
};

export function createPlaywrightBrowserClient(
  deps: PlaywrightBrowserClientDeps = {
    chromiumType: chromium,
  },
): PlaywrightBrowserClient {
  return {
    launch() {
      return deps.chromiumType.launch();
    },
    connect(target) {
      return deps.chromiumType.connectOverCDP(normalizeBrowserTarget(target));
    },
  };
}

function normalizeBrowserTarget(target: string): string {
  if (
    target.startsWith('http://') ||
    target.startsWith('https://') ||
    target.startsWith('ws://') ||
    target.startsWith('wss://')
  ) {
    return target;
  }

  return `http://${target}`;
}
