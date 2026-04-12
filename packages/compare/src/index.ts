export type {
  Comparator,
  ComparePipelineCallOptions,
  ComparisonPipeline,
  ComparisonPipelineConfig,
  ComparisonResult,
  DiffEntry,
  DiffKind,
} from '@seo-solver/types/compare';
export { GenericComparator } from './comparators/generic.js';
export { HeadingsComparator } from './comparators/headings.js';
export { diff } from './diff.js';
export {
  compareAll,
  compareCanonical,
  compareHeadings,
  compareJsonLd,
  compareMetaTags,
  compareOpenGraph,
  compareRobotsTxt,
  createComparisonPipeline,
} from './pipeline.js';
