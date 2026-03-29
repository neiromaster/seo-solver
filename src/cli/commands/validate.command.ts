import { boolean, command, flag, positional, string } from 'cmd-ts';

import { safeRun } from '#core/errors';
import { runValidate } from '#core/validate-runner';

export const validateCommand = command({
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
    safeRun(async () => {
      await runValidate(url, {
        useCurl: curl,
        useOg: og,
      });
    }),
});
