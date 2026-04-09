import { describe, expect, test } from 'vitest';
import { formatValidation } from '../../src/index.js';
import { validationReportFixture } from '../fixtures/validation-report.js';

describe('markdown validation formatter', () => {
  test('renders summary table and collapsible sections by default', () => {
    const output = formatValidation(validationReportFixture, { format: 'markdown' });

    expect(output).toContain('# SEO Audit: example.com');
    expect(output).toContain('| Severity | Count |');
    expect(output).toContain('<details>');
    expect(output).toContain('✅ All checks passed');
  });

  test('can disable collapsible sections', () => {
    const output = formatValidation(validationReportFixture, {
      format: 'markdown',
      markdownCollapsible: false,
      minSeverity: 'warning',
    });

    expect(output).not.toContain('<details>');
    expect(output).not.toContain('canonical/mismatch-og-url');
  });

  test('does not mark hidden diagnostics as passing', () => {
    const output = formatValidation(validationReportFixture, {
      format: 'markdown',
      minSeverity: 'error',
    });

    expect(output).toContain('_No visible diagnostics at current minSeverity._');
    expect(output).not.toContain('## Meta\n\n✅ All checks passed');
  });
});
