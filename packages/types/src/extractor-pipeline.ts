import type { ExtractedPage } from './extracted-page';
import type { ExtractionEnvelope } from './extraction-envelope';
import type { Extractor } from './extractor';
import type { FetchResult } from './fetch-result';
import type { TargetKey } from './target-catalog';

export type ExtractorPipelineConfig = {
  targets?: Array<TargetKey | Extractor>;
  onError?: 'ignore' | 'throw' | 'report';
};

export type ExtractPipelineCallOptions = {
  targets?: Array<TargetKey | Extractor>;
};

export type ExtractorPipeline = {
  extract(input: FetchResult, options?: ExtractPipelineCallOptions): ExtractionEnvelope[];
  readonly extractors: readonly Extractor[];
};

export type ExtractPageOptions = {
  targets?: TargetKey[];
  onError?: 'ignore' | 'throw' | 'report';
};

export type ExtractHtmlOptions = ExtractPageOptions & {
  url?: string;
  statusCode?: number;
};

export type ExtractRobotsTextOptions = {
  url?: string;
};

export type ExtractResultFactory = {
  extractPage(input: FetchResult, options?: ExtractPageOptions): ExtractedPage;
};
