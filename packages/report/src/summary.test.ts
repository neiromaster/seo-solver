import { describe, expect, test } from 'vitest';
import { comparisonReportFixture } from '../test/fixtures/comparison-report.js';
import { validationReportFixture } from '../test/fixtures/validation-report.js';
import { groupDiagnostics, hasFailed, summarizeComparison, summarizeValidation } from './core/summary.js';

describe('summary helpers', () => {
  test('summarizeValidation counts full diagnostic set and hasFailed only tracks errors', () => {
    expect(summarizeValidation(validationReportFixture)).toEqual({
      errors: 1,
      info: 0,
      total: 4,
      warnings: 3,
    });
    expect(hasFailed(validationReportFixture)).toBe(true);
  });

  test('summarizeComparison counts diff kinds and identical types', () => {
    expect(summarizeComparison(comparisonReportFixture)).toEqual({
      added: 2,
      changed: 2,
      identical: 1,
      removed: 1,
      total: 5,
    });
  });

  test('groupDiagnostics merges identical diagnostics and preserves first-seen order', () => {
    expect(
      groupDiagnostics([
        {
          severity: 'warning',
          rule: 'jsonld/adobe/unsupported-property',
          message: 'Property "startDate" for type "Offer" is not supported',
          path: 'Place[0].Event[0].offers',
        },
        {
          severity: 'warning',
          rule: 'jsonld/adobe/unsupported-property',
          message: 'Property "startDate" for type "Offer" is not supported',
          path: 'Place[0].Event[1].offers',
        },
        {
          severity: 'info',
          rule: 'jsonld/duplicate-type',
          message: 'Multiple JSON-LD blocks with @type "Place"',
        },
      ]),
    ).toEqual([
      {
        severity: 'warning',
        rule: 'jsonld/adobe/unsupported-property',
        message: 'Property "startDate" for type "Offer" is not supported',
        paths: ['Place[0].Event[0].offers', 'Place[0].Event[1].offers'],
        expected: undefined,
        actual: undefined,
        count: 2,
      },
      {
        severity: 'info',
        rule: 'jsonld/duplicate-type',
        message: 'Multiple JSON-LD blocks with @type "Place"',
        paths: [],
        expected: undefined,
        actual: undefined,
        count: 1,
      },
    ]);
  });
});
