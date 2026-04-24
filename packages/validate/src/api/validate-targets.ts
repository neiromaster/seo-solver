import type {
  CanonicalData,
  HeadingsData,
  JsonLdData,
  MetaTagsData,
  OpenGraphData,
  RobotsTxtData,
} from '@seo-solver/types/extract';
import type { ExtractionEnvelope } from '@seo-solver/types/extract-advanced';
import type { Diagnostic, Severity } from '@seo-solver/types/validate';
import { createRuleFilter } from '../rule-filter.js';
import { CanonicalValidator } from '../validators/canonical.js';
import { HeadingsValidator } from '../validators/headings.js';
import { JsonLdValidator } from '../validators/jsonld.js';
import { MetaTagsValidator } from '../validators/meta.js';
import { OpenGraphValidator } from '../validators/opengraph.js';
import { RobotsTxtValidator } from '../validators/robots-txt.js';
import { TwitterCardValidator } from '../validators/twitter.js';

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
