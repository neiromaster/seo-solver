import { boolean, command, flag, positional, string } from 'cmd-ts';
import { runDiff } from '#core/diff-runner';
import { safeRun } from '#core/errors';

export const diffCommand = command({
  name: 'diff',
  description: 'Compare structured data between two URLs',
  args: {
    url1: positional({ type: string, displayName: 'url1' }),
    url2: positional({ type: string, displayName: 'url2' }),
    curl: flag({
      type: boolean,
      long: 'curl',
      short: 'c',
      description: 'Use curl for SSR HTML fetching',
    }),
    og: flag({
      type: boolean,
      long: 'og',
      short: 'o',
      description: 'Use OpenGraph instead of JSON-LD',
    }),
    vscode: flag({
      type: boolean,
      long: 'vscode',
      short: 'v',
      description: 'Open VSCode diff viewer',
    }),
  },
  handler: ({ url1, url2, curl, og, vscode }) =>
    safeRun(async () => {
      await runDiff(url1, url2, {
        useCurl: curl,
        useOg: og,
        vscodeDiff: vscode,
      });
    }),
});
