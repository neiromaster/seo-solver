import type { Severity } from '@seo-solver/types/validate';
import { type BuiltInValidatorId, createBuiltInValidators } from './validators/registry';

export type RuleCatalogEntry = {
  id: string;
  validatorId: string;
  validatorKey: string;
  severity: Severity;
  description: string;
  category: 'content' | 'consistency' | 'structured-data' | 'social' | 'crawl' | 'linking';
  defaultEnabled: boolean;
};

const VALIDATOR_ORDER = [
  'canonical',
  'headings',
  'jsonld',
  'meta',
  'opengraph',
  'robots-txt',
  'twitter',
  'pinterest',
  'vk',
  'applinks',
  'cross',
] as const;

const CATEGORIES: Record<BuiltInValidatorId, RuleCatalogEntry['category']> = {
  canonical: 'linking',
  headings: 'content',
  jsonld: 'structured-data',
  meta: 'content',
  opengraph: 'social',
  'robots-txt': 'crawl',
  twitter: 'social',
  pinterest: 'social',
  vk: 'social',
  applinks: 'linking',
  cross: 'consistency',
};

export function listRules(): RuleCatalogEntry[] {
  const validators = createBuiltInValidators();

  return VALIDATOR_ORDER.flatMap((validatorId) => {
    const validator = validators[validatorId];
    const validatorKey = validatorId === 'robots-txt' ? 'robotsTxt' : validatorId;
    const rules = ((validator.rules ?? []) as Array<{ id: string; severity: Severity; message: string }>).slice();

    return rules
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((rule) => ({
        id: rule.id,
        validatorId,
        validatorKey,
        severity: rule.severity,
        description: rule.message,
        category: CATEGORIES[validatorId],
        defaultEnabled: true,
      }));
  });
}
