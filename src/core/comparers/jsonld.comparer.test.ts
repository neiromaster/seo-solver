import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import ansis from 'ansis';
import type { Schema } from '#types';
import { compareJsonLd } from './jsonld.comparer';

function stripAnsi(str: string): string {
  return ansis.strip(str);
}

let logs: string[];
const originalLog = console.log;

beforeEach(() => {
  logs = [];
  console.log = (...args: unknown[]) => {
    logs.push(args.map((a) => String(a)).join(' '));
  };
});

afterEach(() => {
  console.log = originalLog;
});

function output(): string {
  return logs.map(stripAnsi).join('\n');
}

const article1: Schema = { '@type': 'Article', name: 'Article1' };
const article2: Schema = { '@type': 'Article', name: 'Article2' };
const product1: Schema = { '@type': 'Product', name: 'Product1' };

describe('compareJsonLd — empty inputs', () => {
  test('produces no output for two empty arrays', () => {
    compareJsonLd([], []);
    expect(output()).toBe('');
  });
});

describe('compareJsonLd — type removed (only in s1)', () => {
  test('shows type label with count in URL1', () => {
    compareJsonLd([article1], []);
    const out = output();
    expect(out).toContain('Article');
    expect(out).toContain('1 in URL1');
  });

  test('shows field values of removed schemas', () => {
    compareJsonLd([article1], []);
    const out = output();
    expect(out).toContain('name');
    expect(out).toContain('Article1');
  });

  test('shows #index suffix for multiple removed schemas', () => {
    compareJsonLd([article1, article2], []);
    const out = output();
    expect(out).toContain('#1');
    expect(out).toContain('#2');
  });
});

describe('compareJsonLd — type added (only in s2)', () => {
  test('shows type label with count in URL2', () => {
    compareJsonLd([], [article1]);
    const out = output();
    expect(out).toContain('Article');
    expect(out).toContain('1 in URL2');
  });

  test('shows field values of added schemas', () => {
    compareJsonLd([], [article1]);
    const out = output();
    expect(out).toContain('name');
    expect(out).toContain('Article1');
  });

  test('shows #index suffix for multiple added schemas', () => {
    compareJsonLd([], [article1, article2]);
    const out = output();
    expect(out).toContain('#1');
    expect(out).toContain('#2');
  });
});

describe('compareJsonLd — identical schemas', () => {
  test('shows checkmark for matching single schemas', () => {
    compareJsonLd([article1], [{ ...article1 }]);
    const out = output();
    expect(out).toContain('identical');
    expect(out).toContain('Article');
  });

  test('shows count in identical message', () => {
    compareJsonLd([article1, article2], [{ ...article1 }, { ...article2 }]);
    const out = output();
    expect(out).toContain('identical');
    expect(out).toContain('2');
  });

  test('shows checkmark for multiple matching types', () => {
    compareJsonLd([article1, product1], [{ ...article1 }, { ...product1 }]);
    const out = output();
    expect(out).toContain('Article');
    expect(out).toContain('Product');
  });
});

describe('compareJsonLd — changed field values', () => {
  test('shows diff for changed field', () => {
    compareJsonLd([{ '@type': 'Article', name: 'Old' }], [{ '@type': 'Article', name: 'New' }]);
    const out = output();
    expect(out).toContain('name');
    expect(out).toContain('Old');
    expect(out).toContain('New');
  });

  test('shows diff header with counts', () => {
    compareJsonLd([{ '@type': 'Article', name: 'A' }], [{ '@type': 'Article', name: 'B' }]);
    const out = output();
    expect(out).toContain('1 vs 1');
  });

  test('shows added field within same-type schemas', () => {
    compareJsonLd([{ '@type': 'Article', name: 'A' }], [{ '@type': 'Article', name: 'A', description: 'D' }]);
    const out = output();
    expect(out).toContain('description');
  });

  test('shows removed field within same-type schemas', () => {
    compareJsonLd([{ '@type': 'Article', name: 'A', description: 'D' }], [{ '@type': 'Article', name: 'A' }]);
    const out = output();
    expect(out).toContain('description');
  });
});

describe('compareJsonLd — count mismatch (asymmetric)', () => {
  test('shows removed schema when s1 has more', () => {
    compareJsonLd([article1, article2], [{ ...article1 }]);
    const out = output();
    expect(out).toContain('2 vs 1');
    expect(out).toContain('Article2');
  });

  test('shows added schema when s2 has more', () => {
    compareJsonLd([{ ...article1 }], [article1, article2]);
    const out = output();
    expect(out).toContain('1 vs 2');
    expect(out).toContain('Article2');
  });

  test('shows #index suffix in pairwise comparison', () => {
    compareJsonLd([article1, article2], [article1, { '@type': 'Article', name: 'Modified' }]);
    const out = output();
    expect(out).toContain('#2');
    expect(out).toContain('Modified');
  });
});

describe('compareJsonLd — no @type', () => {
  test('shows (no @type) label for schemas without @type', () => {
    compareJsonLd([{ name: 'NoType' }], []);
    expect(output()).toContain('(no @type)');
  });

  test('groups schemas without @type together', () => {
    compareJsonLd([{ name: 'A' }, { name: 'B' }], [{ name: 'A' }, { name: 'B' }]);
    const out = output();
    expect(out).toContain('(no @type)');
    expect(out).toContain('identical');
  });
});

describe('compareJsonLd — nested objects', () => {
  test('flattens nested objects and shows dot-notation diff', () => {
    compareJsonLd(
      [{ '@type': 'Article', author: { name: 'John' } }],
      [{ '@type': 'Article', author: { name: 'Jane' } }],
    );
    const out = output();
    expect(out).toContain('author.name');
    expect(out).toContain('John');
    expect(out).toContain('Jane');
  });
});

describe('compareJsonLd — array values', () => {
  test('serializes array values as JSON for comparison', () => {
    compareJsonLd([{ '@type': 'Article', tags: ['a', 'b'] }], [{ '@type': 'Article', tags: ['a', 'c'] }]);
    const out = output();
    expect(out).toContain('["a","b"]');
    expect(out).toContain('["a","c"]');
  });
});

describe('compareJsonLd — multiple types', () => {
  test('handles types present in s1 only and s2 only', () => {
    compareJsonLd([article1], [product1]);
    const out = output();
    expect(out).toContain('Article');
    expect(out).toContain('1 in URL1');
    expect(out).toContain('Product');
    expect(out).toContain('1 in URL2');
  });

  test('handles one type identical and another changed', () => {
    compareJsonLd([article1, product1], [{ ...article1 }, { '@type': 'Product', name: 'Modified' }]);
    const out = output();
    expect(out).toContain('identical');
    expect(out).toContain('Modified');
  });
});

describe('compareJsonLd — null values', () => {
  test('handles null field values', () => {
    compareJsonLd([{ '@type': 'Article', description: null }], [{ '@type': 'Article', description: 'Has desc' }]);
    const out = output();
    expect(out).toContain('description');
    expect(out).toContain('null');
    expect(out).toContain('Has desc');
  });
});
