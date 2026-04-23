export type {
  CanonicalData,
  CanonicalHrefLang,
  ExtractedPage,
  ExtractedPageError,
  ExtractHtmlOptions,
  ExtractPageOptions,
  ExtractRobotsTextOptions,
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
export { extractHtml, extractPage, extractRobotsText } from './api/extract-page.js';
export {
  extractCanonical,
  extractHeadings,
  extractJsonLd,
  extractMetaTags,
  extractOpenGraph,
} from './api/extract-targets.js';
export { listTargets } from './core/catalog.js';
export { ExtractionError } from './errors.js';
export { getTargetData, getTargetStatus, hasTargetData } from './status.js';
