import { describe, expect, test } from 'vitest';
import { extractHeadings } from '../../index.js';
import { readFixture } from '../../test-support/fixtures.js';

describe('HeadingsExtractor', () => {
  test('extracts headings in document order', () => {
    expect(extractHeadings(readFixture('full-seo.html'))).toEqual([
      { level: 1, text: 'Main Title' },
      { level: 2, text: 'Section One' },
      { level: 3, text: 'Subsection' },
    ]);
  });

  test('normalizes nested text', () => {
    expect(extractHeadings('<h1><span>A </span>B</h1>')).toEqual([{ level: 1, text: 'A B' }]);
  });

  test('returns null when no headings exist', () => {
    expect(extractHeadings(readFixture('minimal.html'))).toBeNull();
  });
});
