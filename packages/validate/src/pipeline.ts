import type {
  CanonicalData,
  ExtractedDataByTarget,
  ExtractedPage,
  HeadingsData,
  JsonLdData,
  MetaTagsData,
  OpenGraphData,
  RobotsTxtData,
  TargetKey,
} from '@seo-solver/types/extract';
import type { ExtractionEnvelope } from '@seo-solver/types/extract-advanced';
import type { Diagnostic, Severity, ValidationResult } from '@seo-solver/types/validate';
import type { ValidationPipeline, ValidationPipelineConfig } from '@seo-solver/types/validate-advanced';
import { toExtractErrorDiagnostics } from './extract-error-diagnostics.js';
import { toPresenceDiagnostics } from './presence-rules.js';
import { createRuleFilter } from './rule-filter.js';
import { CanonicalValidator } from './validators/canonical.js';
import { HeadingsValidator } from './validators/headings.js';
import { JsonLdValidator } from './validators/jsonld.js';
import { MetaTagsValidator } from './validators/meta.js';
import { OpenGraphValidator } from './validators/opengraph.js';
import { resolveValidators } from './validators/registry.js';
import { RobotsTxtValidator } from './validators/robots-txt.js';
import { TwitterCardValidator } from './validators/twitter.js';

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
  const ruleFilter = createRuleFilter({
    disableRules: options.disableRules ?? [],
    severityOverrides: options.severityOverrides ?? {},
  });
  const allowedValidatorTypes = getAllowedValidatorTypes(options.validators);
  const targetStatus = resolveTargetStatus(input);
  const validations = mergeValidationResults(
    [
      ...toExtractErrorDiagnostics(input.errors, input.source.url),
      ...toPresenceDiagnostics(targetStatus, input.source.url, allowedValidatorTypes),
    ].map((entry) => ({
      ...entry,
      diagnostics: ruleFilter.apply(entry.diagnostics),
    })),
    await createValidationPipeline(options).validate(toEnvelopes(input)),
  );

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

export type ValidateRuleOptions = {
  disableRules?: string[];
  severityOverrides?: Record<string, Severity>;
};

export type ValidateJsonLdOptions = ValidateRuleOptions & {
  runtime?: {
    jsonldAdobe?: {
      enabled?: boolean;
      cacheFile?: string | null;
      refreshTtlMs?: number;
      schemaUrl?: string;
    };
  };
};

export type ValidateDataOptions = ValidateRuleOptions;

export async function validateOpenGraph(data: OpenGraphData, options: ValidateDataOptions = {}): Promise<Diagnostic[]> {
  return validateData(new OpenGraphValidator(), toEnvelope('opengraph', data), options);
}

export async function validateJsonLd(data: JsonLdData, options: ValidateJsonLdOptions = {}): Promise<Diagnostic[]> {
  return validateData(new JsonLdValidator(options.runtime?.jsonldAdobe), toEnvelope('jsonld', data), options);
}

export async function validateMetaTags(data: MetaTagsData, options: ValidateDataOptions = {}): Promise<Diagnostic[]> {
  return validateData(new MetaTagsValidator(), toEnvelope('meta', data), options);
}

export async function validateTwitterCards(
  data: MetaTagsData,
  options: ValidateDataOptions = {},
): Promise<Diagnostic[]> {
  return validateData(new TwitterCardValidator(), toEnvelope('meta', data), options);
}

export async function validateHeadings(data: HeadingsData, options: ValidateDataOptions = {}): Promise<Diagnostic[]> {
  return validateData(new HeadingsValidator(), toEnvelope('headings', data), options);
}

export async function validateCanonical(data: CanonicalData, options: ValidateDataOptions = {}): Promise<Diagnostic[]> {
  return validateData(new CanonicalValidator(), toEnvelope('canonical', data), options);
}

export async function validateRobotsTxt(data: RobotsTxtData, options: ValidateDataOptions = {}): Promise<Diagnostic[]> {
  return validateData(new RobotsTxtValidator(), toEnvelope('robots-txt', data), options);
}

async function validateData<T>(
  validator: {
    type: string;
    validate: (
      envelope: ExtractionEnvelope<T>,
      context?: ExtractionEnvelope[],
      options?: { disableAdobeValidation?: boolean; isRuleEnabled?: (ruleId: string) => boolean },
    ) => Promise<Diagnostic[]>;
  },
  envelope: ExtractionEnvelope<T>,
  options: ValidateRuleOptions,
): Promise<Diagnostic[]> {
  const ruleFilter = createRuleFilter({
    disableRules: options.disableRules ?? [],
    severityOverrides: options.severityOverrides ?? {},
  });

  if (ruleFilter.hasWildcardDisabled(validator.type)) {
    return [];
  }

  const diagnostics = await validator.validate(envelope, [envelope], {
    disableAdobeValidation:
      validator.type === 'jsonld' &&
      (ruleFilter.hasWildcardDisabled('jsonld') || ruleFilter.hasWildcardDisabled('jsonld/adobe')),
    isRuleEnabled: (ruleId) => !ruleFilter.isDisabled(ruleId),
  });

  return ruleFilter.apply(diagnostics);
}

function toEnvelope<T>(type: string, data: T): ExtractionEnvelope<T> {
  return {
    type,
    source: '',
    data,
  };
}

function toEnvelopes(page: ExtractedPage): ExtractionEnvelope[] {
  const envelopes: ExtractionEnvelope[] = [];

  for (const entry of [
    toPageEnvelope(page, 'canonical'),
    toPageEnvelope(page, 'headings'),
    toPageEnvelope(page, 'jsonld'),
    toPageEnvelope(page, 'meta'),
    toPageEnvelope(page, 'opengraph'),
    toPageEnvelope(page, 'robotsTxt'),
  ]) {
    if (entry !== null) {
      envelopes.push(entry);
    }
  }

  return envelopes;
}

function toPageEnvelope<K extends TargetKey>(
  page: ExtractedPage,
  target: K,
): ExtractionEnvelope<ExtractedDataByTarget[K]> | null {
  const targetStatus = resolveTargetStatus(page);
  if (targetStatus[target] !== 'present') {
    return null;
  }

  const data = page.data[target];
  if (data === null || data === undefined) {
    return null;
  }

  return {
    type: target === 'robotsTxt' ? 'robots-txt' : target,
    source: page.source.url,
    data,
  };
}

function getAllowedValidatorTypes(validators: ValidationPipelineConfig['validators']): ReadonlySet<string> | undefined {
  if (!validators) {
    return undefined;
  }

  return new Set(
    validators
      .map((validator) => (typeof validator === 'string' ? validator : validator.type))
      .filter((validatorType) => validatorType !== '*'),
  );
}

function resolveTargetStatus(page: ExtractedPage) {
  if (page.targetStatus) {
    return page.targetStatus;
  }

  const targetStatus: Partial<Record<TargetKey, 'present' | 'missing'>> = {};
  for (const target of ['canonical', 'headings', 'jsonld', 'meta', 'opengraph', 'robotsTxt'] satisfies TargetKey[]) {
    if (!(target in page.data)) {
      continue;
    }

    targetStatus[target] = page.data[target] === null ? 'missing' : 'present';
  }

  return targetStatus;
}

function mergeValidationResults(base: ValidationResult[], incoming: ValidationResult[]): ValidationResult[] {
  const merged = new Map<string, ValidationResult>();

  for (const result of [...base, ...incoming]) {
    const existing = merged.get(result.type);
    if (!existing) {
      merged.set(result.type, {
        type: result.type,
        source: result.source,
        diagnostics: [...result.diagnostics],
      });
      continue;
    }

    existing.diagnostics.push(...result.diagnostics);
  }

  return [...merged.values()];
}
