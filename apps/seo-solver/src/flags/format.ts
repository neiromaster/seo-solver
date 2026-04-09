import { option, optional, string } from 'cmd-ts';

export const formatFlag = option({
  long: 'format',
  short: 'f',
  type: optional(string),
  description: 'Output format. Supported values depend on the command.',
});
