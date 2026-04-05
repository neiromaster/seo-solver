import { option, optional, string } from 'cmd-ts';

export const fetcherArgs = {
  fetcher: option({
    type: optional(string),
    long: 'fetcher',
    short: 'f',
    description: 'Fetcher backend: basic, chrome, chrome:<port|host:port|url>',
  }),
};
