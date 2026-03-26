import { command } from 'cleye';
import { runDiff } from '#core/diff-runner';

export const diffCommand = command(
  {
    name: 'diff',
    parameters: ['<url1>', '<url2>'],
    flags: {
      vscode: {
        type: Boolean,
        alias: 'v',
        description: 'Open VSCode diff viewer',
      },
      curl: {
        type: Boolean,
        alias: 'c',
        description: 'Use curl for SSR HTML fetching',
      },
      og: {
        type: Boolean,
        alias: 'o',
        description: 'Compare OpenGraph tags instead of JSON-LD',
      },
    },
    help: {
      description: 'Compare structured data between two URLs',
    },
  },
  async (argv) => {
    await runDiff(argv._.url1, argv._.url2, {
      useCurl: argv.flags.curl ?? false,
      useOg: argv.flags.og ?? false,
      vscodeDiff: argv.flags.vscode ?? false,
    });
  },
);
