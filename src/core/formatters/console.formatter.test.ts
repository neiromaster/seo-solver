import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import ansis from 'ansis';
import type { FlatData } from '#types';
import { buildFlatDiffLines, printFlatDiff } from './console.formatter';

type LogSpy = ReturnType<typeof spyOn<typeof console, 'log'>>;

function strippedLogs(spy: LogSpy): string[] {
  return spy.mock.calls.map((args) => ansis.strip(String(args[0] ?? '')));
}

describe('printFlatDiff', () => {
  let logSpy: LogSpy;

  beforeEach(() => {
    logSpy = spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  describe('when data is identical', () => {
    test('logs ✓ identical message', () => {
      const a = { title: 'Hello' };
      const b = { title: 'Hello' };

      printFlatDiff(a, b);

      expect(strippedLogs(logSpy)).toEqual(['✓ identical', '']);
    });

    test('logs message and trailing blank line', () => {
      const a = { x: '1', y: '2' };
      const b = { x: '1', y: '2' };

      printFlatDiff(a, b);

      expect(logSpy.mock.calls).toHaveLength(2);
      expect(logSpy.mock.calls.at(-1)).toEqual([]);
    });

    test('treats two empty objects as identical', () => {
      const a = {};
      const b = {};

      printFlatDiff(a, b);

      expect(strippedLogs(logSpy)[0]).toContain('✓ identical');
    });
  });

  describe('when a value has changed', () => {
    test('logs the key name', () => {
      const a = { title: 'Old Title' };
      const b = { title: 'New Title' };

      printFlatDiff(a, b);

      expect(strippedLogs(logSpy)[0]).toContain('title');
    });

    test('logs the old value prefixed with -', () => {
      const a = { title: 'Old Title' };
      const b = { title: 'New Title' };

      printFlatDiff(a, b);

      expect(strippedLogs(logSpy)[1]).toContain('- Old Title');
    });

    test('logs the new value prefixed with +', () => {
      const a = { title: 'Old Title' };
      const b = { title: 'New Title' };

      printFlatDiff(a, b);

      expect(strippedLogs(logSpy)[2]).toContain('+ New Title');
    });

    test('ends with a trailing empty console.log call', () => {
      const a = { title: 'Old' };
      const b = { title: 'New' };

      printFlatDiff(a, b);

      expect(logSpy.mock.calls.at(-1)).toEqual([]);
    });
  });

  describe('when a key is removed', () => {
    test('logs the removed key with its value prefixed with -', () => {
      const a = { title: 'Hello', description: 'World' };
      const b = { title: 'Hello' };

      printFlatDiff(a, b);

      const logs = strippedLogs(logSpy);
      const removedLine = logs.find((l) => l.includes('description'));
      expect(removedLine).toContain('- description: World');
    });

    test('joins array values for removed keys', () => {
      const a = { tags: ['seo', 'meta'] };
      const b = {};

      printFlatDiff(a, b);

      expect(strippedLogs(logSpy)).toContain('  - tags: seo, meta');
    });

    test('renders runtime undefined values as empty strings', () => {
      const a = { orphan: undefined } as unknown as FlatData;
      const b = {};

      printFlatDiff(a, b);

      expect(strippedLogs(logSpy)).toContain('  + orphan: ');
    });

    test('ends with a trailing empty console.log call', () => {
      const a = { title: 'Hello', extra: 'gone' };
      const b = { title: 'Hello' };

      printFlatDiff(a, b);

      expect(logSpy.mock.calls.at(-1)).toEqual([]);
    });
  });

  describe('when a key is added', () => {
    test('logs the added key with its value prefixed with +', () => {
      const a = { title: 'Hello' };
      const b = { title: 'Hello', description: 'World' };

      printFlatDiff(a, b);

      const logs = strippedLogs(logSpy);
      const addedLine = logs.find((l) => l.includes('description'));
      expect(addedLine).toContain('+ description: World');
    });

    test('logs array-valued added keys as comma-separated text', () => {
      const a = {};
      const b = { tags: ['seo', 'meta'] };

      printFlatDiff(a, b);

      expect(strippedLogs(logSpy)).toContain('  + tags: seo, meta');
    });

    test('ends with a trailing empty console.log call', () => {
      const a = { title: 'Hello' };
      const b = { title: 'Hello', extra: 'new' };

      printFlatDiff(a, b);

      expect(logSpy.mock.calls.at(-1)).toEqual([]);
    });
  });

  describe('when data has diffs, added, and removed keys combined', () => {
    test('logs changed key, removed key, and added key', () => {
      const a = { title: 'Old', removed: 'gone' };
      const b = { title: 'New', added: 'here' };

      printFlatDiff(a, b);

      const logs = strippedLogs(logSpy);
      expect(logs.some((l) => l.includes('title'))).toBe(true);
      expect(logs.some((l) => l.includes('- Old'))).toBe(true);
      expect(logs.some((l) => l.includes('- removed: gone'))).toBe(true);
      expect(logs.some((l) => l.includes('+ added: here'))).toBe(true);
    });
  });
});

describe('buildFlatDiffLines', () => {
  test('returns identical line plus trailing blank entry for identical data', () => {
    const lines = buildFlatDiffLines({ title: 'Hello' }, { title: 'Hello' }).map(ansis.strip);

    expect(lines).toEqual(['✓ identical', '']);
  });

  test('returns changed, removed, added and trailing blank entries in order', () => {
    const lines = buildFlatDiffLines({ title: 'Old', removed: 'gone' }, { title: 'New', added: 'here' }).map(
      ansis.strip,
    );

    expect(lines).toEqual(['  title', '    - Old', '    + New', '  - removed: gone', '  + added: here', '']);
  });

  test('formats changed array values with comma-separated text', () => {
    const lines = buildFlatDiffLines({ tags: ['seo', 'meta'] }, { tags: ['seo', 'schema'] }).map(ansis.strip);

    expect(lines).toEqual(['  tags', '    - seo, meta', '    + seo, schema', '']);
  });

  test('formats added array values with comma-separated text', () => {
    const lines = buildFlatDiffLines({}, { tags: ['seo', 'meta'] }).map(ansis.strip);

    expect(lines).toEqual(['  + tags: seo, meta', '']);
  });

  test('formats runtime undefined values as empty strings for keys classified as added', () => {
    const lines = buildFlatDiffLines({ orphan: undefined } as unknown as FlatData, {}).map(ansis.strip);

    expect(lines).toEqual(['  + orphan: ', '']);
  });
});
