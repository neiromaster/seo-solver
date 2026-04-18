import type { ExtractedPage } from './extracted-page.js';
import type { ExtractionEnvelope } from './extraction-envelope.js';
import type { Extractor } from './extractor.js';
import type { FetchResult } from './fetch-result.js';
import type { TargetKey } from './target-catalog.js';

export type ExtractorPipelineConfig = {
  targets?: Array<TargetKey | Extractor> | undefined;
  onError?: 'ignore' | 'throw' | 'report' | undefined;
};

export type ExtractPipelineCallOptions = {
  targets?: Array<TargetKey | Extractor> | undefined;
};

export type ExtractorPipeline = {
  extract(input: FetchResult, options?: ExtractPipelineCallOptions): ExtractionEnvelope[];
  readonly extractors: readonly Extractor[];
};

export type ExtractPageOptions = {
  targets?: TargetKey[] | undefined;
  onError?: 'ignore' | 'throw' | 'report' | undefined;
};

export type ExtractHtmlOptions = ExtractPageOptions & {
  url?: string | undefined;
  statusCode?: number | undefined;
};

export type ExtractRobotsTextOptions = {
  url?: string | undefined;
};

export type ExtractResultFactory = {
  extractPage(input: FetchResult, options?: ExtractPageOptions): ExtractedPage;
};
