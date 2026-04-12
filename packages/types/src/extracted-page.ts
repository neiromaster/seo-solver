import type { ExtractionEnvelope } from './extraction-envelope.js';
import type { FetchResult } from './fetch-result.js';

export type ExtractedPage = {
  fetch: FetchResult;
  extractions: ExtractionEnvelope[];
};
