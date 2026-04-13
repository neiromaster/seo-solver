import { comparePages } from '@seo-solver/compare';
import type { ComparisonReport } from '@seo-solver/types/compare';
import type { TargetKey } from '@seo-solver/types/extract';
import type { Fetcher } from '@seo-solver/types/fetch';
import { type ExtractOptions, runExtract } from './extract.js';

export interface CompareOptions extends ExtractOptions {
  ignoreFields?: Record<string, string[]>;
  targets?: TargetKey[];
}

export async function runCompare(
  fetcher: Fetcher,
  urlA: string,
  urlB: string,
  options: CompareOptions = {},
): Promise<ComparisonReport> {
  const [resultA, resultB] = await Promise.all([
    runExtract(fetcher, urlA, options),
    runExtract(fetcher, urlB, options),
  ]);

  return comparePages(resultA.page, resultB.page, {
    targets: options.targets,
    ignoreFields: options.ignoreFields,
  });
}
