import { command } from 'cmd-ts';
import { CLIError, handleError } from '../cli-support/error-handler';
import { resolveFetcher } from '../cli-support/fetcher-registry';
import { writeOutput } from '../cli-support/output';
import { parseTargets, targetsFlag } from '../flags/extractor';
import { fetcherFlags } from '../flags/fetcher';
import { formatFlag } from '../flags/format';
import { outputFlag } from '../flags/output';
import { urlArg } from '../flags/url';
import { quietFlag, verboseFlag } from '../flags/verbosity';
import { resolveExtractFormat } from '../types';
import { runExtract } from '../workflows/extract';

export const extractCommand = command({
  name: 'extract',
  description: 'Extract SEO data from a URL (no validation)',
  args: {
    url: urlArg,
    format: formatFlag,
    verbose: verboseFlag,
    quiet: quietFlag,
    ...fetcherFlags,
    targets: targetsFlag,
    output: outputFlag,
  },
  handler: async (args) => {
    let fetcher: Awaited<ReturnType<typeof resolveFetcher>> | undefined;

    try {
      fetcher = await resolveFetcher(args);
      const { page } = await runExtract(fetcher, args.url, {
        targets: parseTargets(args.targets),
      });
      const format = resolveExtractFormat(args.format);

      if (format !== 'json') {
        throw new CLIError(`Unsupported extract format: ${format}. Expected: json`);
      }

      await writeOutput(
        JSON.stringify(
          {
            source: page.source,
            data: page.data,
            errors: page.errors,
          },
          null,
          2,
        ),
        args.output,
      );
    } catch (error) {
      handleError(error);
    } finally {
      await fetcher?.dispose();
    }
  },
});
