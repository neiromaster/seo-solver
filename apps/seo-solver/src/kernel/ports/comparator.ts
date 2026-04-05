import type { CapabilityId, DiffResult, ExtractedDocument } from '#kernel/models';

export type Comparator = {
  readonly id: CapabilityId;
  compare(left: ExtractedDocument, right: ExtractedDocument): Promise<DiffResult>;
};
