import { comparePages } from '@seo-solver/compare';
import type { ComparisonReport } from '@seo-solver/types/compare';
import type { ExtractedPage, TargetKey } from '@seo-solver/types/extract';
import type { Fetcher } from '@seo-solver/types/fetch';
import { type ExtractOptions, runExtract } from './extract.js';

export interface CompareOptions extends ExtractOptions {
  ignoreFields?: Record<string, string[]> | undefined;
  targets?: TargetKey[] | undefined;
}

export type CompareResult = {
  report: ComparisonReport;
  leftPage: ExtractedPage;
  rightPage: ExtractedPage;
};

export async function runCompare(
  fetcher: Fetcher,
  urlA: string,
  urlB: string,
  options: CompareOptions = {},
): Promise<CompareResult> {
  const [resultA, resultB] = await Promise.all([
    runExtract(fetcher, urlA, options),
    runExtract(fetcher, urlB, options),
  ]);

  const report = comparePages(resultA.page, resultB.page, {
    ...(options.targets === undefined ? {} : { targets: options.targets }),
    ...(options.ignoreFields === undefined ? {} : { ignoreFields: options.ignoreFields }),
  });

  return {
    report,
    leftPage: resultA.page,
    rightPage: resultB.page,
  };
}
