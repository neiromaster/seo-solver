import type { Diagnostic } from './diagnostic.js';
import type { ExtractionEnvelope } from './extraction-envelope.js';

export type Validator = {
  readonly type: string;
  validate(envelope: ExtractionEnvelope, context?: ExtractionEnvelope[]): Promise<Diagnostic[]>;
};
