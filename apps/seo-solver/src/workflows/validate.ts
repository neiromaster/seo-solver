import type { TargetKey } from '@seo-solver/types/extract';
import type { Fetcher } from '@seo-solver/types/fetch';
import type { Severity, ValidationReport } from '@seo-solver/types/validate';
import { validatePage } from '@seo-solver/validate';
import { type ExtractOptions, runExtract } from './extract.js';

export type ValidateOptions = ExtractOptions & {
  disableRules?: string[] | undefined;
  severityOverrides?: Record<string, Severity> | undefined;
  targets?: TargetKey[] | undefined;
  runtime?:
    | {
        jsonldAdobe?:
          | {
              enabled?: boolean | undefined;
              cacheFile?: string | null | undefined;
              refreshTtlMs?: number | undefined;
              schemaUrl?: string | undefined;
            }
          | undefined;
      }
    | undefined;
};

export async function runValidate(
  fetcher: Fetcher,
  url: string,
  options: ValidateOptions = {},
): Promise<ValidationReport> {
  const { page } = await runExtract(fetcher, url, options);

  return await validatePage(page, {
    ...(options.disableRules === undefined ? {} : { disableRules: options.disableRules }),
    ...(options.severityOverrides === undefined ? {} : { severityOverrides: options.severityOverrides }),
    ...(options.runtime === undefined ? {} : { runtime: options.runtime }),
  });
}
