import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { formatComparison, formatValidation } from '../src/index.js';
import { comparisonReportFixture } from './fixtures/comparison-report.js';
import { validationReportFixture } from './fixtures/validation-report.js';

function readExpected(fileName: string): string {
  return readFileSync(resolve(import.meta.dirname, 'fixtures/expected', fileName), 'utf8');
}

describe('golden outputs', () => {
  test('matches terminal validation golden file', () => {
    expect(formatValidation(validationReportFixture, { color: false, verbosity: 'normal' })).toBe(
      readExpected('terminal-validation.txt'),
    );
  });

  test('matches terminal validation quiet golden file', () => {
    expect(formatValidation(validationReportFixture, { color: false, verbosity: 'quiet' })).toBe(
      readExpected('terminal-validation-quiet.txt'),
    );
  });

  test('matches terminal validation verbose golden file', () => {
    expect(formatValidation(validationReportFixture, { color: false, verbosity: 'verbose' })).toBe(
      readExpected('terminal-validation-verbose.txt'),
    );
  });

  test('matches terminal comparison golden file', () => {
    expect(formatComparison(comparisonReportFixture, { color: false, verbosity: 'normal' })).toBe(
      readExpected('terminal-comparison.txt'),
    );
  });

  test('matches terminal comparison quiet golden file', () => {
    expect(formatComparison(comparisonReportFixture, { color: false, verbosity: 'quiet' })).toBe(
      readExpected('terminal-comparison-quiet.txt'),
    );
  });

  test('matches terminal comparison verbose golden file', () => {
    expect(formatComparison(comparisonReportFixture, { color: false, verbosity: 'verbose' })).toBe(
      readExpected('terminal-comparison-verbose.txt'),
    );
  });

  test('matches json validation golden file', () => {
    expect(formatValidation(validationReportFixture, { format: 'json' })).toBe(readExpected('json-validation.json'));
  });

  test('matches json comparison golden file', () => {
    expect(formatComparison(comparisonReportFixture, { format: 'json' })).toBe(readExpected('json-comparison.json'));
  });

  test('matches markdown validation golden file', () => {
    expect(formatValidation(validationReportFixture, { format: 'markdown' })).toBe(
      readExpected('markdown-validation.md'),
    );
  });

  test('matches markdown comparison golden file', () => {
    expect(formatComparison(comparisonReportFixture, { format: 'markdown' })).toBe(
      readExpected('markdown-comparison.md'),
    );
  });

  test('matches html validation golden file', () => {
    expect(formatValidation(validationReportFixture, { format: 'html' })).toBe(readExpected('html-validation.html'));
  });

  test('matches html comparison golden file', () => {
    expect(formatComparison(comparisonReportFixture, { format: 'html' })).toBe(readExpected('html-comparison.html'));
  });
});
