import type { ExtractionEnvelope, OpenGraphData } from '@seo-solver/types';
import { createRuleCatalog, type RuleDefinition, runRules } from '../utils/rules.js';

export class AppLinksValidator {
  readonly type = 'opengraph';

  readonly rules: readonly RuleDefinition<OpenGraphData>[] = [
    {
      id: 'applinks/ios-incomplete',
      severity: 'warning',
      message: 'App Links iOS metadata is incomplete',
      check: (data) => incompletePlatformResult(data, 'ios', ['url', 'app_store_id', 'app_name']),
    },
    {
      id: 'applinks/android-incomplete',
      severity: 'warning',
      message: 'App Links Android metadata is incomplete',
      check: (data) => incompletePlatformResult(data, 'android', ['url', 'package', 'app_name']),
    },
  ];

  async validate(
    envelope: ExtractionEnvelope<OpenGraphData>,
    context?: ExtractionEnvelope[],
    options?: { isRuleEnabled?: (ruleId: string) => boolean },
  ) {
    return runRules(envelope, context, this.rules, options);
  }
}

export const appLinksRuleCatalog = createRuleCatalog('opengraph', new AppLinksValidator().rules);

function incompletePlatformResult(data: OpenGraphData, platform: 'ios' | 'android', keys: string[]) {
  const prefix = `al:${platform}:`;
  const existingKeys = Object.keys(data).filter((key) => key.startsWith(prefix));
  if (existingKeys.length === 0) {
    return null;
  }

  const missingKeys = keys.filter((key) => !hasValue(data[`${prefix}${key}`]));
  return missingKeys.length > 0 ? { expected: keys, actual: existingKeys } : null;
}

function hasValue(value: string | string[] | undefined): boolean {
  if (typeof value === 'string') {
    return value !== '';
  }

  return Array.isArray(value) ? value.some((entry) => entry !== '') : false;
}
