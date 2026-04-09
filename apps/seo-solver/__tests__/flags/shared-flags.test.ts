import { describe, expect, test } from 'vitest';
import { parseExtractors } from '../../src/flags/extractor.js';
import { parseSeverityOverrides } from '../../src/flags/rules.js';
import { resolveVerbosity } from '../../src/flags/verbosity.js';

describe('shared flags', () => {
  test('resolveVerbosity prefers quiet over verbose', () => {
    expect(resolveVerbosity(false, false)).toBe('normal');
    expect(resolveVerbosity(true, false)).toBe('verbose');
    expect(resolveVerbosity(false, true)).toBe('quiet');
    expect(resolveVerbosity(true, true)).toBe('quiet');
  });

  test('parseExtractors returns trimmed extractor names', () => {
    expect(parseExtractors(undefined)).toBeUndefined();
    expect(parseExtractors('opengraph, jsonld ,, meta')).toEqual(['opengraph', 'jsonld', 'meta']);
  });

  test('parseSeverityOverrides skips invalid entries', () => {
    expect(parseSeverityOverrides(['og/title=error', 'broken', 'meta/description=warning', 'x=y'])).toEqual({
      'meta/description': 'warning',
      'og/title': 'error',
    });
  });
});
