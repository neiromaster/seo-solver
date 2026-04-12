import type { Comparator, DiffEntry } from '@seo-solver/types/compare';
import type { ExtractionEnvelope } from '@seo-solver/types/extract';
import { diff } from '../diff.js';

export type GenericComparatorOptions = {
  ignoreArrayOrder?: boolean;
  pathPrefix?: string;
};

export class GenericComparator implements Comparator {
  readonly type: string | string[];
  private readonly options: GenericComparatorOptions;

  constructor(type: string | string[] = '*', options: GenericComparatorOptions = {}) {
    this.type = type;
    this.options = options;
  }

  compare(a: ExtractionEnvelope, b: ExtractionEnvelope): DiffEntry[] {
    return diff(a.data, b.data, {
      ignoreArrayOrder: this.options.ignoreArrayOrder,
      pathPrefix: this.options.pathPrefix,
    });
  }
}
