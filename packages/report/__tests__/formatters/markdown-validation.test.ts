import type { ValidationReport } from '@seo-solver/types';
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
    expect(output).toContain('canonical/mismatch-og-url');
  });

  test('does not mark hidden diagnostics as passing', () => {
    const output = formatValidation(validationReportFixture, {
      format: 'markdown',
      minSeverity: 'error',
    });

    expect(output).toContain('_No visible diagnostics at current minSeverity._');
    expect(output).not.toContain('## Meta\n\n✅ All checks passed');
  });

  test('groups identical diagnostics and renders paths as a simple list', () => {
    const groupedReport: ValidationReport = {
      fetch: { redirects: [], statusCode: 200, timing: 42 },
      timestamp: '2026-04-09T15:30:00Z',
      url: 'https://example.com/page',
      validations: [
        {
          type: 'jsonld',
          source: 'https://example.com/page',
          diagnostics: [
            {
              severity: 'warning',
              rule: 'jsonld/adobe/unsupported-property',
              message: 'Property "startDate" for type "Offer" is not supported by the schema.org specification',
              path: 'Place[0].Event[0].event.Offer.offers',
            },
            {
              severity: 'warning',
              rule: 'jsonld/adobe/unsupported-property',
              message: 'Property "startDate" for type "Offer" is not supported by the schema.org specification',
              path: 'Place[0].Event[1].event.Offer.offers',
            },
          ],
        },
      ],
    };

    const output = formatValidation(groupedReport, { format: 'markdown', markdownCollapsible: false });

    expect(output).toContain('`jsonld/adobe/unsupported-property ×2`');
    expect(output).toContain(
      'Property "startDate" for type "Offer" is not supported by the schema.org specification<br />- Place[0].Event[0].event.Offer.offers<br />- Place[0].Event[1].event.Offer.offers',
    );
  });
});
