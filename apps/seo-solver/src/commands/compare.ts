import { command } from 'cmd-ts';
import { handleError } from '../cli-support/error-handler.js';
import { resolveFetcher } from '../cli-support/fetcher-registry.js';
import { writeOutput } from '../cli-support/output.js';
import { buildReporter } from '../cli-support/reporter-config.js';
import { extractorsFlag, parseExtractors } from '../flags/extractor.js';
import { fetcherFlags } from '../flags/fetcher.js';
import { formatFlag } from '../flags/format.js';
import { outputFlag } from '../flags/output.js';
import { urlArgA, urlArgB } from '../flags/url.js';
import { quietFlag, verboseFlag } from '../flags/verbosity.js';
import { hasDiffs } from '../types.js';
import { runCompare } from '../workflows/compare.js';

export const compareCommand = command({
  name: 'compare',
  description: 'Compare SEO markup between two URLs',
  args: {
    urlA: urlArgA,
    urlB: urlArgB,
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
      const report = await runCompare(fetcher, args.urlA, args.urlB, {
        extractors: parseExtractors(args.extractors),
      });

      const reporter = buildReporter(args);
      const output = reporter.formatComparison(report);
      await writeOutput(output, args.output);
      process.exitCode = hasDiffs(report.comparisons) ? 1 : 0;
    } catch (error) {
      handleError(error);
    } finally {
      await fetcher?.dispose();
    }
  },
});
