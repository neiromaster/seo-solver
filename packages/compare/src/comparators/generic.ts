import type { DiffEntry } from '@seo-solver/types/compare';
import type { Comparator } from '@seo-solver/types/compare-advanced';
import type { ExtractionEnvelope } from '@seo-solver/types/extract-advanced';
import { diff } from '../diff';

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
