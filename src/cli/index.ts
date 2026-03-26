import { cli } from 'cleye';
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
    // Default behavior - show help if no command provided
    argv.showHelp();
  },
);
