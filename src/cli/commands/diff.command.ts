import { boolean, command, flag, option, optional, positional, string } from 'cmd-ts';
import { fetcherArgs } from '#cli/fetcher-args';

export type DiffCommandDeps = {
  runDiff: (
    url1: string,
    url2: string,
    options: {
      fetcherId: 'basic' | 'browser';
      extractorId: 'jsonld' | 'opengraph';
      rendererId: 'terminal' | 'editor-diff';
      editor?: string;
    },
  ) => Promise<void>;
  safeRun: (fn: () => Promise<void>) => Promise<void>;
  resolveFetcher: (input: { curl: boolean; fetcher?: string }) => { fetcherId: 'basic' | 'browser'; warning?: string };
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
        const resolvedFetcher = deps.resolveFetcher({ curl, fetcher });

        if (resolvedFetcher.warning) {
          deps.warn(resolvedFetcher.warning);
        }

        await deps.runDiff(url1, url2, {
          fetcherId: resolvedFetcher.fetcherId,
          extractorId: og ? 'opengraph' : 'jsonld',
          rendererId: editor ? 'editor-diff' : 'terminal',
          editor,
        });
      }),
  });
}
