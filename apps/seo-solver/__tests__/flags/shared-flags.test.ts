import { parseSeverityOverrides } from '@seo-solver/validate';
import { describe, expect, test } from 'vitest';
import { parseTargets } from '../../src/flags/extractor';
import { resolveVerbosity } from '../../src/flags/verbosity';

describe('shared flags', () => {
  test('resolveVerbosity prefers quiet over verbose', () => {
    expect(resolveVerbosity(false, false)).toBe('normal');
    expect(resolveVerbosity(true, false)).toBe('verbose');
    expect(resolveVerbosity(false, true)).toBe('quiet');
    expect(resolveVerbosity(true, true)).toBe('quiet');
  });

  test('parseTargets returns trimmed target names', () => {
    expect(parseTargets(undefined)).toBeUndefined();
    expect(parseTargets('opengraph, jsonld ,, meta')).toEqual(['opengraph', 'jsonld', 'meta']);
  });

  test('parseSeverityOverrides fails on malformed entries', () => {
    expect(() => parseSeverityOverrides(['opengraph/title=error', 'broken'])).toThrow(
      'Invalid severity override: opengraph/title=error',
    );
  });
});
