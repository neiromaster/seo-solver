import type { CapabilityId } from './capability-id';
import type { SourceRef } from './source-ref';

export type ExtractedDocument<TData = unknown> = {
  extractorId: CapabilityId;
  kind: string;
  source: SourceRef;
  data: TData;
  summary?: {
    itemCount?: number;
    labels?: string[];
  };
};
