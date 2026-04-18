import type { DiffEntry } from './diff-entry.js';
import type { ExtractionEnvelope } from './extraction-envelope.js';

export type Comparator = {
  readonly type: string | string[];
  compare(a: ExtractionEnvelope, b: ExtractionEnvelope): DiffEntry[];
};
