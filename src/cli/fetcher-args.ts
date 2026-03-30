import { boolean, flag, option, optional, string } from 'cmd-ts';

export const fetcherArgs = {
  curl: flag({
    type: boolean,
    long: 'curl',
    short: 'c',
    description: 'Deprecated: use --fetcher curl',
  }),
  fetcher: option({
    type: optional(string),
    long: 'fetcher',
    short: 'f',
    description: 'Fetcher backend: basic, curl, chrome, chrome:<port|host:port|url>',
  }),
};
