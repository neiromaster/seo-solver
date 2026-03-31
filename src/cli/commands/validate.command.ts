import { boolean, command, flag, option, optional, positional, string } from 'cmd-ts';

import { fetcherArgs } from '#cli/fetcher-args';

export type ValidateCommandDeps = {
  runValidate: (
    url: string,
    options: {
      fetcherId: 'basic' | 'browser';
      extractorId: 'jsonld' | 'opengraph';
      rendererId: 'terminal';
      editor?: string;
    },
  ) => Promise<void>;
  safeRun: (fn: () => Promise<void>) => Promise<void>;
  resolveFetcher: (input: { fetcher?: string }) => { fetcherId: 'basic' | 'browser'; warning?: string };
  warn: (message: string) => void;
};

export function createValidateCommand(deps: ValidateCommandDeps) {
  return command({
    name: 'validate',
    description: 'Validate structured data on a single URL',
    args: {
      url: positional({ type: string, displayName: 'url' }),
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
        description: 'Open extracted metadata in editor',
      }),
    },
    handler: ({ url, fetcher, og, editor }) =>
      deps.safeRun(async () => {
        const resolvedFetcher = deps.resolveFetcher({ fetcher });

        if (resolvedFetcher.warning) {
          deps.warn(resolvedFetcher.warning);
        }

        await deps.runValidate(url, {
          fetcherId: resolvedFetcher.fetcherId,
          extractorId: og ? 'opengraph' : 'jsonld',
          rendererId: 'terminal',
          editor,
        });
      }),
  });
}
