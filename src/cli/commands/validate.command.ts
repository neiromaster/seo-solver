import { boolean, command, flag, option, optional, positional, string } from 'cmd-ts';

import { fetcherArgs } from '#cli/fetcher-args';
import { resolveFetcherOption } from '#cli/fetcher-option';
import type { safeRun as safeRunDefault } from '#core/errors';
import type { RunValidate } from '#core/validate-runner';

export type ValidateCommandDeps = {
  runValidate: RunValidate;
  safeRun: typeof safeRunDefault;
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
    handler: ({ url, curl, fetcher, og, editor }) =>
      deps.safeRun(async () => {
        const resolvedFetcher = resolveFetcherOption({ curl, fetcher });

        if (resolvedFetcher.warning) {
          deps.warn(resolvedFetcher.warning);
        }

        await deps.runValidate(url, {
          fetcher: resolvedFetcher.fetcher,
          useOg: og,
          editor,
        });
      }),
  });
}
