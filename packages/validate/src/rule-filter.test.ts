import { describe, expect, test } from 'vitest';
import { createRuleFilter, matchesDisablePattern } from './rule-filter';

describe('rule-filter', () => {
  test('matches wildcard prefixes precisely', () => {
    expect(matchesDisablePattern('opengraph/title-missing', 'opengraph/*')).toBe(true);
    expect(matchesDisablePattern('ogx/title-missing', 'opengraph/*')).toBe(false);
  });

  test('disabled rules win over severity overrides', () => {
    const filter = createRuleFilter({
      disableRules: ['opengraph/title-missing'],
      severityOverrides: {
        'opengraph/title-missing': 'info',
        'opengraph/description-missing': 'error',
      },
    });

    expect(
      filter.apply([
        { severity: 'error', rule: 'opengraph/title-missing', message: 'remove me' },
        { severity: 'warning', rule: 'opengraph/description-missing', message: 'keep me' },
      ]),
    ).toEqual([{ severity: 'error', rule: 'opengraph/description-missing', message: 'keep me' }]);
  });
});
