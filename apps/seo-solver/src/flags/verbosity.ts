import type { Verbosity } from '@seo-solver/types';
import { flag } from 'cmd-ts';

export const verboseFlag = flag({
  long: 'verbose',
  short: 'v',
  description: 'Show detailed output with paths, expected/actual values',
});

export const quietFlag = flag({
  long: 'quiet',
  short: 'q',
  description: 'Show only summary line',
});

export function resolveVerbosity(verbose: boolean, quiet: boolean): Verbosity {
  if (quiet) {
    return 'quiet';
  }

  if (verbose) {
    return 'verbose';
  }

  return 'normal';
}
