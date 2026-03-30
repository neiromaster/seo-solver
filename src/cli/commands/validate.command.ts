import { boolean, command, flag, option, optional, positional, string } from 'cmd-ts';

import type { safeRun as safeRunDefault } from '#core/errors';
import type { RunValidate } from '#core/validate-runner';

export type ValidateCommandDeps = {
  runValidate: RunValidate;
  safeRun: typeof safeRunDefault;
};

export function createValidateCommand(deps: ValidateCommandDeps) {
  return command({
    name: 'validate',
    description: 'Validate structured data on a single URL',
    args: {
      url: positional({ type: string, displayName: 'url' }),
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
        description: 'Open extracted metadata in editor',
      }),
    },
    handler: ({ url, curl, og, editor }) =>
      deps.safeRun(async () => {
        await deps.runValidate(url, {
          useCurl: curl,
          useOg: og,
          editor,
        });
      }),
  });
}
