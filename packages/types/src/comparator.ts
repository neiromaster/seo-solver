import type { DiffEntry } from './diff-entry';
import type { ExtractionEnvelope } from './extraction-envelope';

export type Comparator = {
  readonly type: string | string[];
  compare(a: ExtractionEnvelope, b: ExtractionEnvelope): DiffEntry[];
};
