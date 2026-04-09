import type { Comparator } from './comparator.js';
import type { ComparisonResult } from './comparison-result.js';
import type { ExtractionEnvelope } from './extraction-envelope.js';

export type ComparisonPipelineConfig = {
  types?: string[];
  ignoreFields?: Record<string, string[]>;
  ignoreArrayOrder?: boolean;
  comparators?: Comparator[];
};

export type ComparePipelineCallOptions = {
  types?: string[];
  ignoreFields?: Record<string, string[]>;
};

export type ComparisonPipeline = {
  compare(
    envelopesA: ExtractionEnvelope[],
    envelopesB: ExtractionEnvelope[],
    options?: ComparePipelineCallOptions,
  ): ComparisonResult[];
};
