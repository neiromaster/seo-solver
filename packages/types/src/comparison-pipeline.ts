import type { Comparator } from './comparator';
import type { ComparisonResult } from './comparison-result';
import type { ExtractionEnvelope } from './extraction-envelope';

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
