import { describe, expect, test } from 'vitest';
import { validationReportFixture } from '../../test/fixtures/validation-report';
import { formatValidationReport } from '../index';

describe('html validation formatter', () => {
  test('renders self-contained html with escaped values and dark mode css', () => {
    const output = formatValidationReport(validationReportFixture, { format: 'html' });

    expect(output).toContain('<!DOCTYPE html>');
    expect(output).toContain('<title>SEO Audit — example.com</title>');
    expect(output).toContain('prefers-color-scheme');
    expect(output).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
    expect(output).not.toContain('<script>alert("x")</script>');
  });

  test('does not mark hidden diagnostics as passed when filtered out', () => {
    const output = formatValidationReport(validationReportFixture, { format: 'html', minSeverity: 'error' });

    expect(output).toContain('Hidden by filter');
    expect(output).toContain('No visible diagnostics at current minSeverity.');
    expect(output).toContain('Headings <span class="muted">Passed</span>');
    expect(output).not.toContain('Meta <span class="muted">Passed</span>');
    expect(output).not.toContain('Canonical <span class="muted">Passed</span>');
  });
});
