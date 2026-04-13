import type { ValidationReport } from '@seo-solver/types/validate';
import { describe, expect, test } from 'vitest';
import { formatValidationReport } from '../../src/index';
import { validationReportFixture } from '../fixtures/validation-report';

describe('terminal validation formatter', () => {
  test('renders quiet output as a single summary line', () => {
    expect(formatValidationReport(validationReportFixture, { color: false, verbosity: 'quiet' })).toBe(
      '✗ https://example.com/page  1 errors · 3 warnings · 0 info',
    );
  });

  test('applies minSeverity to details but keeps full summary counts', () => {
    const output = formatValidationReport(validationReportFixture, {
      color: false,
      minSeverity: 'warning',
      verbosity: 'normal',
    });

    expect(output).toContain('canonical/mismatch-og-url');
    expect(output).toContain('1 errors · 3 warnings · 0 info');
    expect(output).toContain('✓ All checks passed');
  });

  test('does not mark hidden diagnostics as passing', () => {
    const output = formatValidationReport(validationReportFixture, {
      color: false,
      minSeverity: 'error',
      verbosity: 'normal',
    });

    expect(output).toContain('No visible diagnostics at current minSeverity');
    expect(output).not.toContain('Meta\n  ✓ All checks passed');
    expect(output).not.toContain('Canonical\n  ✓ All checks passed');
  });

  test('renders verbose details with redirect chain and full values', () => {
    const output = formatValidationReport(validationReportFixture, { color: false, verbosity: 'verbose' });

    expect(output).toContain('1 redirect: 301 → http://example.com/page');
    expect(output).toContain('path:     og:description');
    expect(output).toContain('expected: ≤ 200');
    expect(output).toContain('value:    "Line 1 with <script>alert(\\"x\\")</script>');
  });

  test('groups identical diagnostics into multiline blocks with path tree', () => {
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

    const output = formatValidationReport(groupedReport, { color: false, verbosity: 'normal' });

    expect(output).toContain('jsonld/adobe/unsupported-property');
    expect(output).toContain('×2');
    expect(output).toContain('Property "startDate" for type "Offer" is not supported');
    expect(output).toContain('├── Place[0].Event[0].event.Offer.offers');
    expect(output).toContain('└── Place[0].Event[1].event.Offer.offers');
  });
});
