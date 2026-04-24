import type { Severity } from '@seo-solver/types/validate';
import { listPresenceRules } from './basic-core/presence-rule-data.js';
import { STATIC_RULE_CATALOGS } from './rule-catalog-data.js';

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

type BuiltInValidatorId =
  | 'canonical'
  | 'headings'
  | 'jsonld'
  | 'meta'
  | 'opengraph'
  | 'robots-txt'
  | 'twitter'
  | 'pinterest'
  | 'vk'
  | 'applinks'
  | 'cross';

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

const BUILT_IN_RULE_CATALOGS = STATIC_RULE_CATALOGS satisfies Record<
  BuiltInValidatorId,
  ReadonlyArray<{ rule: string; severity: Severity; validator: string; description: string }>
>;

const RULE_CATALOG: RuleCatalogEntry[] = VALIDATOR_ORDER.flatMap((validatorId) => {
  const validatorKey = validatorId === 'robots-txt' ? 'robotsTxt' : validatorId;
  const staticRules: Array<{ id: string; severity: Severity; message: string }> = BUILT_IN_RULE_CATALOGS[
    validatorId
  ].map((rule) => ({ id: rule.rule, severity: rule.severity, message: rule.description }));
  const presenceRules: Array<{ id: string; severity: Severity; message: string }> = listPresenceRules()
    .filter((rule) => rule.validatorType === validatorId)
    .map((rule) => ({ id: rule.ruleId, severity: rule.severity, message: rule.message }));
  const rules: Array<{ id: string; severity: Severity; message: string }> = [...staticRules, ...presenceRules];

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

export function listRules(): RuleCatalogEntry[] {
  return RULE_CATALOG;
}
