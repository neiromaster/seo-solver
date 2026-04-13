import { describe, expect, test } from 'vitest';
import { parseHtml } from './parse-html';

describe('parseHtml', () => {
  test('loads html into a queryable document', () => {
    const document = parseHtml('<html lang="en"><body><h1>Hello</h1></body></html>');
    expect(document('h1').text()).toBe('Hello');
  });
});
