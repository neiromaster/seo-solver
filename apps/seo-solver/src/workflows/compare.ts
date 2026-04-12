import { createComparisonPipeline } from '@seo-solver/compare';
import type { ComparisonReport } from '@seo-solver/types/compare';
import type { Fetcher } from '@seo-solver/types/fetch';
import { type ExtractOptions, runExtract } from './extract.js';

export interface CompareOptions extends ExtractOptions {
  ignoreFields?: Record<string, string[]>;
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

  const pipeline = createComparisonPipeline({
    ignoreFields: options.ignoreFields,
  });

  const comparisons = pipeline.compare(resultA.envelopes, resultB.envelopes, {
    ignoreFields: options.ignoreFields,
  });

  return {
    urlA: resultA.fetchResult.url,
    urlB: resultB.fetchResult.url,
    timestamp: new Date().toISOString(),
    fetchA: {
      statusCode: resultA.fetchResult.statusCode,
      timing: resultA.fetchResult.timing,
    },
    fetchB: {
      statusCode: resultB.fetchResult.statusCode,
      timing: resultB.fetchResult.timing,
    },
    comparisons,
  };
}
