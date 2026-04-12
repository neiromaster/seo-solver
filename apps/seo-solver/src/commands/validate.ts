import { hasFailed } from '@seo-solver/report';
import { command } from 'cmd-ts';
import { handleError } from '../cli-support/error-handler.js';
import { resolveFetcher } from '../cli-support/fetcher-registry.js';
import { writeOutput } from '../cli-support/output.js';
import { buildReporter } from '../cli-support/reporter-config.js';
import { extractorsFlag, parseExtractors } from '../flags/extractor.js';
import { fetcherFlags } from '../flags/fetcher.js';
import { formatFlag } from '../flags/format.js';
import { outputFlag } from '../flags/output.js';
import { disableRulesFlag, parseSeverityOverrides, severityOverrideFlag } from '../flags/rules.js';
import { minSeverityFlag } from '../flags/severity.js';
import { urlArg } from '../flags/url.js';
import { quietFlag, verboseFlag } from '../flags/verbosity.js';
import { runValidate } from '../workflows/validate.js';

export const validateCommand = command({
  name: 'validate',
  description: 'Run SEO validation on a URL',
  args: {
    url: urlArg,
    format: formatFlag,
    verbose: verboseFlag,
    quiet: quietFlag,
    ...fetcherFlags,
    extractors: extractorsFlag,
    minSeverity: minSeverityFlag,
    disableRules: disableRulesFlag,
    severityOverrides: severityOverrideFlag,
    output: outputFlag,
  },
  handler: async (args) => {
    let fetcher: Awaited<ReturnType<typeof resolveFetcher>> | undefined;

    try {
      fetcher = await resolveFetcher(args);
      const report = await runValidate(fetcher, args.url, {
        extractors: parseExtractors(args.extractors),
        disableRules: args.disableRules,
        severityOverrides: parseSeverityOverrides(args.severityOverrides),
      });

      const reporter = buildReporter(args);
      const output = reporter.formatValidation(report);
      await writeOutput(output, args.output);
      process.exitCode = hasFailed(report) ? 1 : 0;
    } catch (error) {
      handleError(error);
    } finally {
      await fetcher?.dispose();
    }
  },
});
