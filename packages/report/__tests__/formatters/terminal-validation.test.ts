import { describe, expect, test } from 'vitest';
import { formatValidation } from '../../src/index.js';
import { validationReportFixture } from '../fixtures/validation-report.js';

describe('terminal validation formatter', () => {
  test('renders quiet output as a single summary line', () => {
    expect(formatValidation(validationReportFixture, { color: false, verbosity: 'quiet' })).toBe(
      '✗ https://example.com/page  1 errors · 2 warnings · 1 info',
    );
  });

  test('applies minSeverity to details but keeps full summary counts', () => {
    const output = formatValidation(validationReportFixture, {
      color: false,
      minSeverity: 'warning',
      verbosity: 'normal',
    });

    expect(output).not.toContain('canonical/mismatch-og-url');
    expect(output).toContain('1 errors · 2 warnings · 1 info');
    expect(output).toContain('✓ All checks passed');
  });

  test('does not mark hidden diagnostics as passing', () => {
    const output = formatValidation(validationReportFixture, {
      color: false,
      minSeverity: 'error',
      verbosity: 'normal',
    });

    expect(output).toContain('No visible diagnostics at current minSeverity');
    expect(output).not.toContain('Meta\n  ✓ All checks passed');
    expect(output).not.toContain('Canonical\n  ✓ All checks passed');
  });

  test('renders verbose details with redirect chain and full values', () => {
    const output = formatValidation(validationReportFixture, { color: false, verbosity: 'verbose' });

    expect(output).toContain('1 redirect: 301 → http://example.com/page');
    expect(output).toContain('path:     og:description');
    expect(output).toContain('expected: ≤ 200');
    expect(output).toContain('value:    "Line 1 with <script>alert(\\"x\\")</script>');
  });
});
