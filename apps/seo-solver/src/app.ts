import { subcommands } from 'cmd-ts';
import { compareCommand } from './commands/compare.js';
import { extractCommand } from './commands/extract.js';
import { listRulesCommand } from './commands/list-rules.js';
import { validateCommand } from './commands/validate.js';

export const app = subcommands({
  name: 'seo-solver',
  description: 'SEO audit and comparison tool',
  cmds: {
    validate: validateCommand,
    compare: compareCommand,
    extract: extractCommand,
    'list-rules': listRulesCommand,
  },
});
