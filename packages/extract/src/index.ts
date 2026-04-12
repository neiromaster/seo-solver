export type {
  CanonicalData,
  CanonicalHrefLang,
  ExtractedPage,
  ExtractionEnvelope,
  ExtractionWarning,
  Extractor,
  ExtractorPipeline,
  ExtractorPipelineConfig,
  ExtractPipelineCallOptions,
  HeadingEntry,
  HeadingsData,
  JsonLdData,
  JsonLdEntry,
  MetaTagsData,
  OpenGraphData,
  RobotsTxtData,
  RobotsTxtGroup,
  TargetCatalogEntry,
  TargetKey,
} from '@seo-solver/types/extract';
export { ExtractionError } from './errors.js';
export { CanonicalExtractor } from './extractors/canonical.js';
export { HeadingsExtractor } from './extractors/headings.js';
export { JsonLdExtractor } from './extractors/jsonld.js';
export { MetaTagsExtractor } from './extractors/meta.js';
export { OpenGraphExtractor } from './extractors/opengraph.js';
export { RobotsTxtExtractor } from './extractors/robots-txt.js';
export {
  createExtractorPipeline,
  extractAll,
  extractCanonical,
  extractHeadings,
  extractJsonLd,
  extractMetaTags,
  extractOpenGraph,
  htmlToMinimalFetchResult,
} from './pipeline.js';

import { RobotsTxtExtractor } from './extractors/robots-txt.js';
import { htmlToMinimalFetchResult } from './pipeline.js';

export function extractRobotsTxt(text: string) {
  return new RobotsTxtExtractor().extract(htmlToMinimalFetchResult(text, 'robots-txt'))?.data ?? null;
}
