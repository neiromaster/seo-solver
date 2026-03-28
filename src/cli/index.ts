import { run, subcommands } from 'cmd-ts';
import pkg from '../../package.json' with { type: 'json' };

import { diffCommand, validateCommand } from './commands';

const app = subcommands({
  name: 'seo-solver',
  version: pkg.version,
  description: 'CLI tool for comparing and validating structured data (JSON-LD, OpenGraph) for SEO',
  cmds: {
    diff: diffCommand,
    validate: validateCommand,
  },
});

run(app, process.argv.slice(2));
