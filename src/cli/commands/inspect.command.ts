import { boolean, command, flag, option, optional, positional, string } from 'cmd-ts';
import { fetcherArgs } from '#cli/fetcher-args';

export type InspectCommandDeps = {
  runInspect: (
    url: string,
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

export function createInspectCommand(deps: InspectCommandDeps) {
  return command({
    name: 'inspect',
    description: 'Inspect extracted metadata on a single URL',
    args: {
      url: positional({ type: string, displayName: 'url' }),
      ...fetcherArgs,
      og: flag({ type: boolean, long: 'og', short: 'o', description: 'Use OpenGraph instead of JSON-LD' }),
      editor: option({
        type: optional(string),
        long: 'editor',
        short: 'e',
        description: 'Open extracted metadata in editor',
      }),
    },
    handler: ({ url, curl, fetcher, og, editor }) =>
      deps.safeRun(async () => {
        const resolvedFetcher = deps.resolveFetcher({ curl, fetcher });
        if (resolvedFetcher.warning) deps.warn(resolvedFetcher.warning);
        await deps.runInspect(url, {
          fetcherId: resolvedFetcher.fetcherId,
          extractorId: og ? 'opengraph' : 'jsonld',
          rendererId: editor ? 'editor-diff' : 'terminal',
          editor,
        });
      }),
  });
}
