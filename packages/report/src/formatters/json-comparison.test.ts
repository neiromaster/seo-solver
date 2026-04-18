import { describe, expect, test } from 'vitest';
import { comparisonReportFixture } from '../../test/fixtures/comparison-report.js';
import { formatComparisonReport } from '../index.js';

describe('json comparison formatter', () => {
  test('returns machine-readable comparison summary and hasDiffs', () => {
    const output = formatComparisonReport(comparisonReportFixture, { format: 'json' });
    const parsed = JSON.parse(output) as {
      comparisons: unknown[];
      hasDiffs: boolean;
      summary: { added: number; changed: number; identical: number; removed: number; total: number };
      urlA: string;
      urlB: string;
    };

    expect(parsed.urlA).toBe('https://staging.example.com');
    expect(parsed.urlB).toBe('https://example.com');
    expect(parsed.hasDiffs).toBe(true);
    expect(parsed.comparisons).toHaveLength(4);
    expect(parsed.summary).toEqual({
      added: 2,
      changed: 2,
      identical: 1,
      removed: 1,
      total: 5,
    });
  });
});
