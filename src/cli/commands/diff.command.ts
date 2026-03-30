import { boolean, command, flag, option, optional, positional, string } from 'cmd-ts';
import type { RunDiff } from '#core/diff-runner';
import type { safeRun as safeRunDefault } from '#core/errors';

export type DiffCommandDeps = {
  runDiff: RunDiff;
  safeRun: typeof safeRunDefault;
};

export function createDiffCommand(deps: DiffCommandDeps) {
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
      editor: option({
        type: optional(string),
        long: 'editor',
        short: 'e',
        description: 'Open diff in editor',
      }),
    },
    handler: ({ url1, url2, curl, og, editor }) =>
      deps.safeRun(async () => {
        await deps.runDiff(url1, url2, {
          useCurl: curl,
          useOg: og,
          editor,
        });
      }),
  });
}
