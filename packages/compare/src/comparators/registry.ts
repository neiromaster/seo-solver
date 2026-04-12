import type { Comparator, ComparisonPipelineConfig } from '@seo-solver/types/compare';
import { GenericComparator } from './generic.js';
import { HeadingsComparator } from './headings.js';

export function resolveComparator(type: string, config: ComparisonPipelineConfig): Comparator {
  const customComparator = config.comparators?.find((candidate) => matchesType(candidate.type, type));
  if (customComparator) {
    return customComparator;
  }

  if (type === 'headings') {
    return new HeadingsComparator();
  }

  return new GenericComparator(type, {
    ignoreArrayOrder: config.ignoreArrayOrder,
    pathPrefix: type === 'jsonld' ? '$' : undefined,
  });
}

function matchesType(candidateType: string | string[], type: string): boolean {
  if (candidateType === '*') {
    return true;
  }

  if (Array.isArray(candidateType)) {
    return candidateType.includes(type);
  }

  return candidateType === type;
}
