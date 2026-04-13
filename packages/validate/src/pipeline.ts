import type {
  CanonicalData,
  ExtractedPage,
  HeadingsData,
  JsonLdData,
  MetaTagsData,
  OpenGraphData,
  RobotsTxtData,
} from '@seo-solver/types/extract';
import type { ExtractionEnvelope } from '@seo-solver/types/extract-advanced';
import type { Diagnostic, ValidationResult } from '@seo-solver/types/validate';
import type { ValidationPipeline, ValidationPipelineConfig } from '@seo-solver/types/validate-advanced';
import { createRuleFilter } from './rule-filter';
import { CanonicalValidator } from './validators/canonical';
import { HeadingsValidator } from './validators/headings';
import { JsonLdValidator } from './validators/jsonld';
import { MetaTagsValidator } from './validators/meta';
import { OpenGraphValidator } from './validators/opengraph';
import { resolveValidators } from './validators/registry';
import { RobotsTxtValidator } from './validators/robots-txt';
import { TwitterCardValidator } from './validators/twitter';

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

export async function validatePage(
  input: ExtractedPage,
  options: Pick<ValidationPipelineConfig, 'validators' | 'disableRules' | 'severityOverrides' | 'runtime'> = {},
) {
  const validations = await createValidationPipeline(options).validate(toEnvelopes(input));

  return {
    url: input.source.url,
    timestamp: new Date().toISOString(),
    fetch: {
      statusCode: input.source.statusCode,
      timing: input.source.timing,
      redirects: input.source.redirects,
    },
    validations,
  };
}

export async function validateOpenGraph(data: OpenGraphData): Promise<Diagnostic[]> {
  return new OpenGraphValidator().validate(toEnvelope('opengraph', data));
}

export async function validateJsonLd(
  data: JsonLdData,
  runtime?: {
    enabled?: boolean;
    cacheFile?: string | null;
    refreshTtlMs?: number;
    schemaUrl?: string;
  },
): Promise<Diagnostic[]> {
  return new JsonLdValidator(runtime).validate(toEnvelope('jsonld', data));
}

export async function validateMetaTags(data: MetaTagsData): Promise<Diagnostic[]> {
  return new MetaTagsValidator().validate(toEnvelope('meta', data));
}

export async function validateTwitterCards(data: MetaTagsData): Promise<Diagnostic[]> {
  return new TwitterCardValidator().validate(toEnvelope('meta', data));
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

function toEnvelopes(page: ExtractedPage): ExtractionEnvelope[] {
  const envelopes: Array<ExtractionEnvelope | null> = [
    page.data.canonical === null ? null : { type: 'canonical', source: page.source.url, data: page.data.canonical },
    page.data.headings === null ? null : { type: 'headings', source: page.source.url, data: page.data.headings },
    page.data.jsonld === null ? null : { type: 'jsonld', source: page.source.url, data: page.data.jsonld },
    page.data.meta === null ? null : { type: 'meta', source: page.source.url, data: page.data.meta },
    page.data.opengraph === null ? null : { type: 'opengraph', source: page.source.url, data: page.data.opengraph },
    page.data.robotsTxt === null ? null : { type: 'robots-txt', source: page.source.url, data: page.data.robotsTxt },
  ];

  return envelopes.filter((entry): entry is ExtractionEnvelope => entry !== null);
}
