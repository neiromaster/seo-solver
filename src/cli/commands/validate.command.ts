import { command } from 'cleye';
import { runValidate } from '#core/validate-runner';

export const validateCommand = command(
  {
    name: 'validate',
    parameters: ['<url>'],
    flags: {
      curl: {
        type: Boolean,
        alias: 'c',
        description: 'Use curl for SSR HTML fetching',
      },
      og: {
        type: Boolean,
        alias: 'o',
        description: 'Validate OpenGraph tags (experimental)',
      },
    },
    help: {
      description: 'Validate structured data on a single URL',
    },
  },
  async (argv) => {
    await runValidate(argv._.url, {
      useCurl: argv.flags.curl ?? false,
      useOg: argv.flags.og ?? false,
    });
  },
);
