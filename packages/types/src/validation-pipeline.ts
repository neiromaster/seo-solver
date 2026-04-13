import type { Severity } from './diagnostic';
import type { ExtractionEnvelope } from './extraction-envelope';
import type { ValidationResult } from './validation-result';
import type { Validator } from './validator';

export type ValidationPipelineConfig = {
  validators?: Array<string | Validator>;
  disableRules?: string[];
  severityOverrides?: Record<string, Severity>;
  runtime?: {
    jsonldAdobe?: {
      enabled?: boolean;
      cacheFile?: string | null;
      refreshTtlMs?: number;
      schemaUrl?: string;
    };
  };
};

export type ValidationPipelineRule = {
  rule: string;
  severity: Severity;
  validator: string;
};

export type ValidationPipeline = {
  validate(envelopes: ExtractionEnvelope[]): Promise<ValidationResult[]>;
  readonly rules: readonly ValidationPipelineRule[];
};
