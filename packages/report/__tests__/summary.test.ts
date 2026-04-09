import { describe, expect, test } from 'vitest';
import { hasFailed, summarizeComparison, summarizeValidation } from '../src/index.js';
import { comparisonReportFixture } from './fixtures/comparison-report.js';
import { validationReportFixture } from './fixtures/validation-report.js';

describe('summary helpers', () => {
  test('summarizeValidation counts full diagnostic set and hasFailed only tracks errors', () => {
    expect(summarizeValidation(validationReportFixture)).toEqual({
      errors: 1,
      info: 1,
      total: 4,
      warnings: 2,
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
});
