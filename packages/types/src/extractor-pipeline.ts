import type { ExtractionEnvelope } from './extraction-envelope.js';
import type { Extractor } from './extractor.js';
import type { FetchResult } from './fetch-result.js';

export type ExtractorPipelineConfig = {
  extractors?: Array<string | Extractor>;
  onError?: 'skip' | 'throw' | 'include';
};

export type ExtractPipelineCallOptions = {
  extractors?: Array<string | Extractor>;
};

export type ExtractorPipeline = {
  extract(input: FetchResult, options?: ExtractPipelineCallOptions): ExtractionEnvelope[];
  readonly extractors: readonly Extractor[];
};
