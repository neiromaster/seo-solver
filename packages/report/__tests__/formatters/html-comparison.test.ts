import { describe, expect, test } from 'vitest';
import { formatComparison } from '../../src/index.js';
import { comparisonReportFixture } from '../fixtures/comparison-report.js';

describe('html comparison formatter', () => {
  test('renders both urls and diff css classes without external assets', () => {
    const output = formatComparison(comparisonReportFixture, { format: 'html' });

    expect(output).toContain('https://staging.example.com');
    expect(output).toContain('https://example.com');
    expect(output).toContain('class="changed"');
    expect(output).toContain('class="added"');
    expect(output).toContain('class="removed"');
    expect(output).not.toContain('<link rel=');
    expect(output).not.toContain('<script src=');
  });
});
