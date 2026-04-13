import { subcommands } from 'cmd-ts';
import { compareCommand } from './commands/compare';
import { extractCommand } from './commands/extract';
import { listRulesCommand } from './commands/list-rules';
import { validateCommand } from './commands/validate';

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
