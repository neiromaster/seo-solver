import { option, optional, string } from 'cmd-ts';

export const minSeverityFlag = option({
  long: 'min-severity',
  type: optional(string),
  description: 'Minimum severity to display: error, warning, info (default: info)',
});
