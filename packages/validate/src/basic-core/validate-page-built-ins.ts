import type { ExtractedDataByTarget, ExtractedPage, TargetKey } from '@seo-solver/types/extract';
import type { ValidationResult } from '@seo-solver/types/validate';
import type { ValidationPipelineConfig } from '@seo-solver/types/validate-advanced';
import {
  type ValidateDataOptions,
  type ValidateJsonLdOptions,
  validateCanonical,
  validateHeadings,
  validateJsonLd,
  validateMetaTags,
  validateOpenGraph,
  validateRobotsTxt,
} from '../api/validate-targets.js';
import { toExtractErrorDiagnostics } from '../extract-error-diagnostics.js';
import { toPresenceDiagnostics } from '../presence-rules.js';
import { createRuleFilter } from '../rule-filter.js';

export type BuiltInValidatePageOptions = {
  disableRules?: string[];
  severityOverrides?: Record<string, 'error' | 'warning' | 'info'>;
  runtime?: ValidationPipelineConfig['runtime'];
};

type ExtractedPageInput = ExtractedPage | (Omit<ExtractedPage, 'targetStatus'> & { targetStatus?: undefined });

export async function validatePageBuiltIns(input: ExtractedPageInput, options: BuiltInValidatePageOptions = {}) {
  const ruleFilter = createRuleFilter({
    disableRules: options.disableRules ?? [],
    severityOverrides: options.severityOverrides ?? {},
  });
  const targetStatus = resolveTargetStatus(input);
  const validations = mergeValidationResults(
    [
      ...toExtractErrorDiagnostics(input.errors, input.source.url),
      ...toPresenceDiagnostics(targetStatus, input.source.url),
    ].map((entry) => ({
      ...entry,
      diagnostics: ruleFilter.apply(entry.diagnostics),
    })),
    await runBuiltInValidations(input, targetStatus, options),
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

async function runBuiltInValidations(
  page: ExtractedPageInput,
  targetStatus: ReturnType<typeof resolveTargetStatus>,
  options: BuiltInValidatePageOptions,
): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  const sharedOptions: ValidateDataOptions = {
    ...(options.disableRules === undefined ? {} : { disableRules: options.disableRules }),
    ...(options.severityOverrides === undefined ? {} : { severityOverrides: options.severityOverrides }),
  };

  if (targetStatus.canonical === 'present' && page.data.canonical) {
    results.push({
      type: 'canonical',
      source: page.source.url,
      diagnostics: await validateCanonical(page.data.canonical, sharedOptions),
    });
  }

  if (targetStatus.headings === 'present' && page.data.headings) {
    results.push({
      type: 'headings',
      source: page.source.url,
      diagnostics: await validateHeadings(page.data.headings, sharedOptions),
    });
  }

  if (targetStatus.jsonld === 'present' && page.data.jsonld) {
    const adobeRuntime = options.runtime?.jsonldAdobe;
    const jsonLdRuntime =
      adobeRuntime === undefined
        ? undefined
        : {
            jsonldAdobe: {
              ...(adobeRuntime.enabled === undefined ? {} : { enabled: adobeRuntime.enabled }),
              ...(adobeRuntime.cacheFile === undefined ? {} : { cacheFile: adobeRuntime.cacheFile }),
              ...(adobeRuntime.refreshTtlMs === undefined ? {} : { refreshTtlMs: adobeRuntime.refreshTtlMs }),
              ...(adobeRuntime.schemaUrl === undefined ? {} : { schemaUrl: adobeRuntime.schemaUrl }),
            },
          };
    const jsonLdOptions: ValidateJsonLdOptions = {
      ...(options.disableRules === undefined ? {} : { disableRules: options.disableRules }),
      ...(options.severityOverrides === undefined ? {} : { severityOverrides: options.severityOverrides }),
      ...(jsonLdRuntime === undefined ? {} : { runtime: jsonLdRuntime }),
    };
    results.push({
      type: 'jsonld',
      source: page.source.url,
      diagnostics: await validateJsonLd(page.data.jsonld, jsonLdOptions),
    });
  }

  if (targetStatus.meta === 'present' && page.data.meta) {
    results.push({
      type: 'meta',
      source: page.source.url,
      diagnostics: await validateMetaTags(page.data.meta, sharedOptions),
    });
  }

  if (targetStatus.opengraph === 'present' && page.data.opengraph) {
    results.push({
      type: 'opengraph',
      source: page.source.url,
      diagnostics: await validateOpenGraph(page.data.opengraph, sharedOptions),
    });
  }

  if (targetStatus.robotsTxt === 'present' && page.data.robotsTxt) {
    results.push({
      type: 'robots-txt',
      source: page.source.url,
      diagnostics: await validateRobotsTxt(page.data.robotsTxt, sharedOptions),
    });
  }

  return results;
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
