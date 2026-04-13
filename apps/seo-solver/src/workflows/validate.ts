import type { TargetKey } from '@seo-solver/types/extract';
import type { Fetcher } from '@seo-solver/types/fetch';
import type { Severity, ValidationReport } from '@seo-solver/types/validate';
import { validatePage } from '@seo-solver/validate';
import { type ExtractOptions, runExtract } from './extract.js';

export type ValidateOptions = ExtractOptions & {
  disableRules?: string[];
  severityOverrides?: Record<string, Severity>;
  targets?: TargetKey[];
  runtime?: {
    jsonldAdobe?: {
      enabled?: boolean;
      cacheFile?: string | null;
      refreshTtlMs?: number;
      schemaUrl?: string;
    };
  };
};

export async function runValidate(
  fetcher: Fetcher,
  url: string,
  options: ValidateOptions = {},
): Promise<ValidationReport> {
  const { page } = await runExtract(fetcher, url, options);

  return await validatePage(page, {
    disableRules: options.disableRules,
    severityOverrides: options.severityOverrides,
    runtime: options.runtime,
  });
}
