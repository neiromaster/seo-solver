export { compareObjects } from './core/compare-objects.js';
export { diff } from './core/diff.js';
export { GenericComparator } from './seo/comparators/generic.js';
export { HeadingsComparator } from './seo/comparators/headings.js';
export {
  compareAll,
  compareCanonical,
  compareHeadings,
  compareJsonLd,
  compareMetaTags,
  compareOpenGraph,
  comparePages,
  compareRobotsTxt,
  createComparisonPipeline,
} from './seo/pipeline.js';
