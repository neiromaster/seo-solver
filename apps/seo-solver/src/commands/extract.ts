import { command } from 'cmd-ts';
import { CLIError, handleError } from '../cli-support/error-handler.js';
import { resolveFetcher } from '../cli-support/fetcher-registry.js';
import { writeOutput } from '../cli-support/output.js';
import { extractorsFlag, parseExtractors } from '../flags/extractor.js';
import { fetcherFlags } from '../flags/fetcher.js';
import { formatFlag } from '../flags/format.js';
import { outputFlag } from '../flags/output.js';
import { urlArg } from '../flags/url.js';
import { quietFlag, verboseFlag } from '../flags/verbosity.js';
import { resolveExtractFormat } from '../types.js';
import { runExtract } from '../workflows/extract.js';

export const extractCommand = command({
  name: 'extract',
  description: 'Extract SEO data from a URL (no validation)',
  args: {
    url: urlArg,
    format: formatFlag,
    verbose: verboseFlag,
    quiet: quietFlag,
    ...fetcherFlags,
    extractors: extractorsFlag,
    output: outputFlag,
  },
  handler: async (args) => {
    let fetcher: Awaited<ReturnType<typeof resolveFetcher>> | undefined;

    try {
      fetcher = await resolveFetcher(args);
      const { fetchResult, envelopes } = await runExtract(fetcher, args.url, {
        extractors: parseExtractors(args.extractors),
      });
      const format = resolveExtractFormat(args.format);

      if (format !== 'json') {
        throw new CLIError(`Unsupported extract format: ${format}. Expected: json`);
      }

      await writeOutput(
        JSON.stringify(
          {
            url: fetchResult.url,
            statusCode: fetchResult.statusCode,
            timing: fetchResult.timing,
            extractions: envelopes.map((envelope) => ({
              type: envelope.type,
              data: envelope.data,
            })),
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
