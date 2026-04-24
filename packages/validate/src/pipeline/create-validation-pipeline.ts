import type { ExtractionEnvelope } from '@seo-solver/types/extract-advanced';
import type { Diagnostic, ValidationResult } from '@seo-solver/types/validate';
import type { ValidationPipeline, ValidationPipelineConfig } from '@seo-solver/types/validate-advanced';
import { createRuleFilter } from '../rule-filter.js';
import { resolveValidators } from '../validators/registry.js';

export function createValidationPipeline(config: ValidationPipelineConfig = {}): ValidationPipeline {
  const configuredValidators = resolveValidators(config, config.validators);

  return {
    async validate(envelopes) {
      const selectedValidators = resolveValidators(config, configuredValidators);
      const ruleFilter = createRuleFilter({
        disableRules: config.disableRules ?? [],
        severityOverrides: config.severityOverrides ?? {},
      });

      const results: ValidationResult[] = [];
      const wildcardValidators = selectedValidators.filter((validator) => validator.type === '*');
      for (const envelope of envelopes) {
        const matchingValidators = selectedValidators.filter((validator) => validator.type === envelope.type);
        if (matchingValidators.length === 0) {
          continue;
        }

        let diagnostics: Diagnostic[] = [];
        for (const validator of matchingValidators) {
          if (ruleFilter.hasWildcardDisabled(validator.type)) {
            continue;
          }

          diagnostics = diagnostics.concat(
            // biome-ignore lint/performance/noAwaitInLoops: validators run sequentially per envelope
            await validator.validate(envelope, envelopes, {
              disableAdobeValidation:
                validator.type === 'jsonld' &&
                (ruleFilter.hasWildcardDisabled('jsonld') || ruleFilter.hasWildcardDisabled('jsonld/adobe')),
              isRuleEnabled: (ruleId) => !ruleFilter.isDisabled(ruleId),
            }),
          );
        }

        results.push({
          type: envelope.type,
          source: envelope.source,
          diagnostics: ruleFilter.apply(diagnostics),
        });
      }

      if (wildcardValidators.length > 0) {
        const firstEnvelope = envelopes[0];
        if (!firstEnvelope) {
          return results;
        }

        let diagnostics: Diagnostic[] = [];
        for (const validator of wildcardValidators) {
          diagnostics = diagnostics.concat(
            // biome-ignore lint/performance/noAwaitInLoops: validators run sequentially for cross-checks
            await validator.validate(firstEnvelope, envelopes, {
              disableAdobeValidation: false,
              isRuleEnabled: (ruleId) => !ruleFilter.isDisabled(ruleId),
            }),
          );
        }

        const filteredDiagnostics = ruleFilter.apply(diagnostics);
        if (filteredDiagnostics.length > 0) {
          const existing = results.find((r) => r.type === firstEnvelope.type);
          if (existing) {
            existing.diagnostics.push(...filteredDiagnostics);
          } else {
            results.push({
              type: '*',
              source: firstEnvelope.source,
              diagnostics: filteredDiagnostics,
            });
          }
        }
      }

      return results;
    },
    get rules() {
      return configuredValidators.flatMap((validator) =>
        (validator.rules ?? []).map((rule) => ({ rule: rule.id, severity: rule.severity, validator: validator.type })),
      );
    },
  };
}

export async function validateAll(envelopes: ExtractionEnvelope[]): Promise<ValidationResult[]> {
  return createValidationPipeline().validate(envelopes);
}
