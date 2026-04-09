import type {
  CanonicalData,
  Diagnostic,
  ExtractionEnvelope,
  HeadingsData,
  JsonLdData,
  MetaTagsData,
  OpenGraphData,
  RobotsTxtData,
  ValidatePipelineCallOptions,
  ValidationPipeline,
  ValidationPipelineConfig,
  ValidationResult,
} from '@seo-solver/types';
import { createRuleFilter } from './rule-filter.js';
import { CanonicalValidator } from './validators/canonical.js';
import { HeadingsValidator } from './validators/headings.js';
import { JsonLdValidator } from './validators/jsonld.js';
import { MetaTagsValidator } from './validators/meta.js';
import { OpenGraphValidator } from './validators/opengraph.js';
import { resolveValidators } from './validators/registry.js';
import { RobotsTxtValidator } from './validators/robots-txt.js';

export function createValidationPipeline(config: ValidationPipelineConfig = {}): ValidationPipeline {
  const configuredValidators = resolveValidators(config, config.validators);

  return {
    async validate(envelopes, options) {
      const selectedValidators = resolveValidators(
        config,
        options?.disableRules ? configuredValidators : configuredValidators,
      );
      const ruleFilter = createRuleFilter({
        disableRules: [...(config.disableRules ?? []), ...(options?.disableRules ?? [])],
        severityOverrides: config.severityOverrides ?? {},
      });

      const results: ValidationResult[] = [];
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

export async function validateOpenGraph(data: OpenGraphData): Promise<Diagnostic[]> {
  return new OpenGraphValidator().validate(toEnvelope('opengraph', data));
}

export async function validateJsonLd(data: JsonLdData): Promise<Diagnostic[]> {
  return new JsonLdValidator().validate(toEnvelope('jsonld', data));
}

export async function validateMetaTags(data: MetaTagsData): Promise<Diagnostic[]> {
  return new MetaTagsValidator().validate(toEnvelope('meta', data));
}

export async function validateHeadings(data: HeadingsData): Promise<Diagnostic[]> {
  return new HeadingsValidator().validate(toEnvelope('headings', data));
}

export async function validateCanonical(data: CanonicalData): Promise<Diagnostic[]> {
  return new CanonicalValidator().validate(toEnvelope('canonical', data));
}

export async function validateRobotsTxt(data: RobotsTxtData): Promise<Diagnostic[]> {
  return new RobotsTxtValidator().validate(toEnvelope('robots-txt', data));
}

function toEnvelope<T>(type: string, data: T): ExtractionEnvelope<T> {
  return {
    type,
    source: '',
    data,
  };
}
