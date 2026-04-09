import { describe, expect, test } from 'vitest';
import { createRuleFilter, matchesDisablePattern } from './rule-filter.js';

describe('rule-filter', () => {
  test('matches wildcard prefixes precisely', () => {
    expect(matchesDisablePattern('og/title-missing', 'og/*')).toBe(true);
    expect(matchesDisablePattern('ogx/title-missing', 'og/*')).toBe(false);
  });

  test('disabled rules win over severity overrides', () => {
    const filter = createRuleFilter({
      disableRules: ['og/title-missing'],
      severityOverrides: { 'og/title-missing': 'info', 'og/description-missing': 'error' },
    });

    expect(
      filter.apply([
        { severity: 'error', rule: 'og/title-missing', message: 'remove me' },
        { severity: 'warning', rule: 'og/description-missing', message: 'keep me' },
      ]),
    ).toEqual([{ severity: 'error', rule: 'og/description-missing', message: 'keep me' }]);
  });
});
