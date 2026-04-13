import type { Diagnostic } from './diagnostic';
import type { ExtractionEnvelope } from './extraction-envelope';

export type Validator = {
  readonly type: string;
  validate(
    envelope: ExtractionEnvelope,
    context?: ExtractionEnvelope[],
    options?: { disableAdobeValidation?: boolean; isRuleEnabled?: (ruleId: string) => boolean },
  ): Promise<Diagnostic[]>;
};
