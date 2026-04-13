import { hasFailed } from '@seo-solver/report';
import { isKnownRuleSelector, parseSeverityOverrides } from '@seo-solver/validate';
import { command } from 'cmd-ts';
import { CLIError, handleError } from '../cli-support/error-handler';
import { resolveFetcher } from '../cli-support/fetcher-registry';
import { writeOutput } from '../cli-support/output';
import { buildReporter } from '../cli-support/reporter-config';
import { parseTargets, targetsFlag } from '../flags/extractor';
import { fetcherFlags } from '../flags/fetcher';
import { formatFlag } from '../flags/format';
import { jsonldRuntimeFlags } from '../flags/jsonld-runtime';
import { outputFlag } from '../flags/output';
import { disableRulesFlag, severityOverrideFlag } from '../flags/rules';
import { minSeverityFlag } from '../flags/severity';
import { urlArg } from '../flags/url';
import { quietFlag, verboseFlag } from '../flags/verbosity';
import { runValidate } from '../workflows/validate';

export const validateCommand = command({
  name: 'validate',
  description: 'Run SEO validation on a URL',
  args: {
    url: urlArg,
    format: formatFlag,
    verbose: verboseFlag,
    quiet: quietFlag,
    ...fetcherFlags,
    ...jsonldRuntimeFlags,
    targets: targetsFlag,
    minSeverity: minSeverityFlag,
    disableRules: disableRulesFlag,
    severityOverrides: severityOverrideFlag,
    output: outputFlag,
  },
  handler: async (args) => {
    let fetcher: Awaited<ReturnType<typeof resolveFetcher>> | undefined;

    try {
      fetcher = await resolveFetcher(args);
      validateDisableRuleSelectors(args.disableRules);
      const report = await runValidate(fetcher, args.url, {
        targets: parseTargets(args.targets),
        disableRules: args.disableRules,
        severityOverrides: parseSeverityOverrides(args.severityOverrides),
        runtime: {
          jsonldAdobe: {
            enabled: args.jsonldRuntime === 'adobe',
            cacheFile: args.jsonldCacheFile ?? null,
            schemaUrl: args.jsonldSchemaUrl,
            refreshTtlMs: args.jsonldSchemaTtlMs,
          },
        },
      });

      const reporter = buildReporter(args);
      const output = reporter.formatValidationReport(report);
      await writeOutput(output, args.output);
      process.exitCode = hasFailed(report) ? 1 : 0;
    } catch (error) {
      handleError(error);
    } finally {
      await fetcher?.dispose();
    }
  },
});

function validateDisableRuleSelectors(patterns: string[]) {
  for (const pattern of patterns) {
    if (!isKnownRuleSelector(pattern)) {
      throw new CLIError(`Unknown rule selector: ${pattern}`);
    }
  }
}
