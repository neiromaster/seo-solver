import type { Severity } from './diagnostic.js';
import type { ExtractionEnvelope } from './extraction-envelope.js';
import type { ValidationResult } from './validation-result.js';
import type { Validator } from './validator.js';

export type ValidationPipelineConfig = {
  validators?: Array<string | Validator> | undefined;
  disableRules?: string[] | undefined;
  severityOverrides?: Record<string, Severity> | undefined;
  runtime?:
    | {
        jsonldAdobe?:
          | {
              enabled?: boolean | undefined;
              cacheFile?: string | null | undefined;
              refreshTtlMs?: number | undefined;
              schemaUrl?: string | undefined;
            }
          | undefined;
      }
    | undefined;
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
