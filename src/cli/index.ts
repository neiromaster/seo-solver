import { cli } from 'cleye';
import { safeRun } from '#core/errors';
import pkg from '../../package.json' with { type: 'json' };

import { diffCommand, validateCommand } from './commands';

cli(
  {
    name: 'seo-solver',
    version: pkg.version,
    help: {
      description: 'CLI tool for comparing and validating structured data (JSON-LD, OpenGraph) for SEO',
    },
    commands: [diffCommand, validateCommand],
  },
  (argv) => {
    safeRun(async () => {
      argv.showHelp();
    });
  },
);
