import type { Comparator } from './comparator.js';
import type { ComparisonResult } from './comparison-result.js';
import type { ExtractionEnvelope } from './extraction-envelope.js';

export type ComparisonPipelineConfig = {
  types?: string[] | undefined;
  ignoreFields?: Record<string, string[]> | undefined;
  ignoreArrayOrder?: boolean | undefined;
  comparators?: Comparator[] | undefined;
};

export type ComparePipelineCallOptions = {
  types?: string[] | undefined;
  ignoreFields?: Record<string, string[]> | undefined;
};

export type ComparisonPipeline = {
  compare(
    envelopesA: ExtractionEnvelope[],
    envelopesB: ExtractionEnvelope[],
    options?: ComparePipelineCallOptions,
  ): ComparisonResult[];
};
