import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { formatComparisonReport, formatValidationReport } from '../src/index';
import { comparisonReportFixture } from './fixtures/comparison-report';
import { validationReportFixture } from './fixtures/validation-report';

function readExpected(fileName: string): string {
  return normalizeOutput(readFileSync(resolve(import.meta.dirname, 'fixtures/expected', fileName), 'utf8'));
}

function expectGolden(actual: string, fileName: string) {
  expect(normalizeOutput(actual)).toBe(readExpected(fileName));
}

function normalizeOutput(value: string): string {
  return value.replace(/\r\n/g, '\n').trimEnd();
}

describe('golden outputs', () => {
  test('matches terminal validation golden file', () => {
    expectGolden(
      formatValidationReport(validationReportFixture, { color: false, verbosity: 'normal' }),
      'terminal-validation.txt',
    );
  });

  test('matches terminal validation quiet golden file', () => {
    expectGolden(
      formatValidationReport(validationReportFixture, { color: false, verbosity: 'quiet' }),
      'terminal-validation-quiet.txt',
    );
  });

  test('matches terminal validation verbose golden file', () => {
    expectGolden(
      formatValidationReport(validationReportFixture, { color: false, verbosity: 'verbose' }),
      'terminal-validation-verbose.txt',
    );
  });

  test('matches terminal comparison golden file', () => {
    expectGolden(
      formatComparisonReport(comparisonReportFixture, { color: false, verbosity: 'normal' }),
      'terminal-comparison.txt',
    );
  });

  test('matches terminal comparison quiet golden file', () => {
    expectGolden(
      formatComparisonReport(comparisonReportFixture, { color: false, verbosity: 'quiet' }),
      'terminal-comparison-quiet.txt',
    );
  });

  test('matches terminal comparison verbose golden file', () => {
    expectGolden(
      formatComparisonReport(comparisonReportFixture, { color: false, verbosity: 'verbose' }),
      'terminal-comparison-verbose.txt',
    );
  });

  test('matches json validation golden file', () => {
    expectGolden(formatValidationReport(validationReportFixture, { format: 'json' }), 'json-validation.json');
  });

  test('matches json comparison golden file', () => {
    expectGolden(formatComparisonReport(comparisonReportFixture, { format: 'json' }), 'json-comparison.json');
  });

  test('matches markdown validation golden file', () => {
    expectGolden(formatValidationReport(validationReportFixture, { format: 'markdown' }), 'markdown-validation.md');
  });

  test('matches markdown comparison golden file', () => {
    expectGolden(formatComparisonReport(comparisonReportFixture, { format: 'markdown' }), 'markdown-comparison.md');
  });

  test('matches html validation golden file', () => {
    expectGolden(formatValidationReport(validationReportFixture, { format: 'html' }), 'html-validation.html');
  });

  test('matches html comparison golden file', () => {
    expectGolden(formatComparisonReport(comparisonReportFixture, { format: 'html' }), 'html-comparison.html');
  });
});
