import type { Severity } from './diagnostic.js';
import type { ExtractionEnvelope } from './extraction-envelope.js';
import type { ValidationResult } from './validation-result.js';
import type { Validator } from './validator.js';

export type ValidationPipelineConfig = {
  validators?: Array<string | Validator>;
  disableRules?: string[];
  severityOverrides?: Record<string, Severity>;
};

export type ValidatePipelineCallOptions = {
  disableRules?: string[];
};

export type ValidationPipelineRule = {
  rule: string;
  severity: Severity;
  validator: string;
};

export type ValidationPipeline = {
  validate(envelopes: ExtractionEnvelope[], options?: ValidatePipelineCallOptions): Promise<ValidationResult[]>;
  readonly rules: readonly ValidationPipelineRule[];
};
