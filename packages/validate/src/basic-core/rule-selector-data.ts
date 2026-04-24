import { STATIC_RULE_CATALOGS } from '../rule-catalog-data.js';
import { listPresenceRules } from './presence-rule-data.js';

const STATIC_RULE_IDS = Object.values(STATIC_RULE_CATALOGS).flatMap((entries) => entries.map((entry) => entry.rule));
const PRESENCE_RULE_IDS = listPresenceRules().map((entry) => entry.ruleId);
const ALL_RULE_IDS = [...STATIC_RULE_IDS, ...PRESENCE_RULE_IDS];

export const KNOWN_RULE_IDS = new Set(ALL_RULE_IDS);
export const KNOWN_PREFIXES = new Set(ALL_RULE_IDS.map((entry) => entry.split('/')[0]));
