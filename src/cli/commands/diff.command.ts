import { boolean, command, flag, option, optional, positional, string } from 'cmd-ts';
import { fetcherArgs } from '#cli/fetcher-args';
import { resolveFetcherOption } from '#cli/fetcher-option';
import type { RunDiff } from '#core/diff-runner';
import type { safeRun as safeRunDefault } from '#core/errors';

export type DiffCommandDeps = {
  runDiff: RunDiff;
  safeRun: typeof safeRunDefault;
  warn: (message: string) => void;
};

export function createDiffCommand(deps: DiffCommandDeps) {
  return command({
    name: 'diff',
    description: 'Compare structured data between two URLs',
    args: {
      url1: positional({ type: string, displayName: 'url1' }),
      url2: positional({ type: string, displayName: 'url2' }),
      ...fetcherArgs,
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
    handler: ({ url1, url2, curl, fetcher, og, editor }) =>
      deps.safeRun(async () => {
        const resolvedFetcher = resolveFetcherOption({ curl, fetcher });

        if (resolvedFetcher.warning) {
          deps.warn(resolvedFetcher.warning);
        }

        await deps.runDiff(url1, url2, {
          fetcher: resolvedFetcher.fetcher,
          useOg: og,
          editor,
        });
      }),
  });
}
