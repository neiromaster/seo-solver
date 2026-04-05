import type { ExtractedDocument, ValidationReport, Validator } from '#kernel';

export class FakeValidator implements Validator {
  readonly id = 'fake-validator';

  async validate(document: ExtractedDocument): Promise<ValidationReport> {
    return {
      validatorId: this.id,
      documentKind: document.kind,
      ok: true,
      issues: [],
    };
  }
}
