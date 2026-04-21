import { option, optional, string } from 'cmd-ts';

export const outputFlag = option({
  long: 'output',
  short: 'o',
  type: optional(string),
  description: 'Write output to file instead of stdout',
});
