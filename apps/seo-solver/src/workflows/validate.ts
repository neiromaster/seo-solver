import type { Fetcher } from '@seo-solver/types/fetch';
import type { Severity, ValidationReport } from '@seo-solver/types/validate';
import { createValidationPipeline } from '@seo-solver/validate';
import { type ExtractOptions, runExtract } from './extract.js';

export type ValidateOptions = ExtractOptions & {
  disableRules?: string[];
  severityOverrides?: Record<string, Severity>;
};

export async function runValidate(
  fetcher: Fetcher,
  url: string,
  options: ValidateOptions = {},
): Promise<ValidationReport> {
  const { fetchResult, envelopes } = await runExtract(fetcher, url, options);

  const pipeline = createValidationPipeline({
    disableRules: options.disableRules,
    severityOverrides: options.severityOverrides,
  });

  const validations = await pipeline.validate(envelopes, {
    disableRules: options.disableRules,
  });

  return {
    url: fetchResult.url,
    timestamp: new Date().toISOString(),
    fetch: {
      statusCode: fetchResult.statusCode,
      timing: fetchResult.timing,
      redirects: fetchResult.redirects,
    },
    validations,
  };
}
