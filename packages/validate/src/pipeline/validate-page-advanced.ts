import type { ExtractedDataByTarget, ExtractedPage, TargetKey } from '@seo-solver/types/extract';
import type { ExtractionEnvelope } from '@seo-solver/types/extract-advanced';
import type { ValidationResult } from '@seo-solver/types/validate';
import type { ValidationPipelineConfig } from '@seo-solver/types/validate-advanced';
import { toExtractErrorDiagnostics } from '../extract-error-diagnostics.js';
import { toPresenceDiagnostics } from '../presence-rules.js';
import { createRuleFilter } from '../rule-filter.js';
import { createValidationPipeline } from './create-validation-pipeline.js';

type ExtractedPageInput = ExtractedPage | (Omit<ExtractedPage, 'targetStatus'> & { targetStatus?: undefined });

export type AdvancedValidatePageOptions = Pick<
  ValidationPipelineConfig,
  'validators' | 'disableRules' | 'severityOverrides' | 'runtime'
>;

export async function validatePageAdvanced(input: ExtractedPageInput, options: AdvancedValidatePageOptions = {}) {
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

function toEnvelopes(page: ExtractedPageInput): ExtractionEnvelope[] {
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
  page: ExtractedPageInput,
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

function getAllowedValidatorTypes(
  validators: AdvancedValidatePageOptions['validators'],
): ReadonlySet<string> | undefined {
  if (!validators) {
    return undefined;
  }

  return new Set(
    validators
      .map((validator) => (typeof validator === 'string' ? validator : validator.type))
      .filter((t) => t !== '*'),
  );
}

function resolveTargetStatus(page: ExtractedPageInput) {
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
