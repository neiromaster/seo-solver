import { createExtractorPipeline } from '@seo-solver/extract';
import type { ExtractionEnvelope } from '@seo-solver/types/extract';
import type { Fetcher, FetchResult } from '@seo-solver/types/fetch';

export type ExtractOptions = {
  extractors?: string[];
};

export type ExtractResult = {
  fetchResult: FetchResult;
  envelopes: ExtractionEnvelope[];
};

export async function runExtract(fetcher: Fetcher, url: string, options: ExtractOptions = {}): Promise<ExtractResult> {
  const fetchResult = await fetcher.fetch(url);
  const pipeline =
    options.extractors === undefined
      ? createExtractorPipeline()
      : createExtractorPipeline({
          extractors: options.extractors,
        });

  const envelopes = pipeline.extract(fetchResult);

  return { fetchResult, envelopes };
}
