import type { CapabilityId, ExtractedDocument, ValidationReport } from '#kernel/models';

export type Validator = {
  readonly id: CapabilityId;
  validate(document: ExtractedDocument): Promise<ValidationReport>;
};
