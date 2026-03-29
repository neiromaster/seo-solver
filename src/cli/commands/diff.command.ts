import { boolean, command, flag, positional, string } from 'cmd-ts';
import { runDiff as runDiffDefault } from '#core/diff-runner';
import { safeRun as safeRunDefault } from '#core/errors';

type DiffCommandDeps = {
  runDiff: typeof runDiffDefault;
  safeRun: typeof safeRunDefault;
};

export function createDiffCommand(deps: DiffCommandDeps = { runDiff: runDiffDefault, safeRun: safeRunDefault }) {
  return command({
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
      deps.safeRun(async () => {
        await deps.runDiff(url1, url2, {
          useCurl: curl,
          useOg: og,
          vscodeDiff: vscode,
        });
      }),
  });
}

export const diffCommand = createDiffCommand();
