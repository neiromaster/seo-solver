import { boolean, command, flag, positional, string } from 'cmd-ts';

import { safeRun as safeRunDefault } from '#core/errors';
import { runValidate as runValidateDefault } from '#core/validate-runner';

type ValidateCommandDeps = {
  runValidate: typeof runValidateDefault;
  safeRun: typeof safeRunDefault;
};

export function createValidateCommand(
  deps: ValidateCommandDeps = { runValidate: runValidateDefault, safeRun: safeRunDefault },
) {
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
    },
    handler: ({ url, curl, og }) =>
      deps.safeRun(async () => {
        await deps.runValidate(url, {
          useCurl: curl,
          useOg: og,
        });
      }),
  });
}

export const validateCommand = createValidateCommand();
