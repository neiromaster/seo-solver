import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import ansis from 'ansis';
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
      // Arrange
      const a = { title: 'Hello' };
      const b = { title: 'Hello' };

      // Act
      printFlatDiff(a, b);

      // Assert
      expect(strippedLogs(logSpy)[0]).toBe('✓ identical\n');
    });

    test('makes exactly one log call and returns early', () => {
      // Arrange
      const a = { x: '1', y: '2' };
      const b = { x: '1', y: '2' };

      // Act
      printFlatDiff(a, b);

      // Assert
      expect(logSpy.mock.calls).toHaveLength(1);
    });

    test('treats two empty objects as identical', () => {
      // Arrange
      const a = {};
      const b = {};

      // Act
      printFlatDiff(a, b);

      // Assert
      expect(strippedLogs(logSpy)[0]).toContain('✓ identical');
    });
  });

  describe('when a value has changed', () => {
    test('logs the key name', () => {
      // Arrange
      const a = { title: 'Old Title' };
      const b = { title: 'New Title' };

      // Act
      printFlatDiff(a, b);

      // Assert
      expect(strippedLogs(logSpy)[0]).toContain('title');
    });

    test('logs the old value prefixed with -', () => {
      // Arrange
      const a = { title: 'Old Title' };
      const b = { title: 'New Title' };

      // Act
      printFlatDiff(a, b);

      // Assert
      expect(strippedLogs(logSpy)[1]).toContain('- Old Title');
    });

    test('logs the new value prefixed with +', () => {
      // Arrange
      const a = { title: 'Old Title' };
      const b = { title: 'New Title' };

      // Act
      printFlatDiff(a, b);

      // Assert
      expect(strippedLogs(logSpy)[2]).toContain('+ New Title');
    });

    test('ends with a trailing empty console.log call', () => {
      // Arrange
      const a = { title: 'Old' };
      const b = { title: 'New' };

      // Act
      printFlatDiff(a, b);

      // Assert
      expect(logSpy.mock.calls.at(-1)).toEqual([]);
    });
  });

  describe('when a key is removed', () => {
    test('logs the removed key with its value prefixed with -', () => {
      // Arrange
      const a = { title: 'Hello', description: 'World' };
      const b = { title: 'Hello' };

      // Act
      printFlatDiff(a, b);

      // Assert
      const logs = strippedLogs(logSpy);
      const removedLine = logs.find((l) => l.includes('description'));
      expect(removedLine).toContain('- description: World');
    });

    test('ends with a trailing empty console.log call', () => {
      // Arrange
      const a = { title: 'Hello', extra: 'gone' };
      const b = { title: 'Hello' };

      // Act
      printFlatDiff(a, b);

      // Assert
      expect(logSpy.mock.calls.at(-1)).toEqual([]);
    });
  });

  describe('when a key is added', () => {
    test('logs the added key with its value prefixed with +', () => {
      // Arrange
      const a = { title: 'Hello' };
      const b = { title: 'Hello', description: 'World' };

      // Act
      printFlatDiff(a, b);

      // Assert
      const logs = strippedLogs(logSpy);
      const addedLine = logs.find((l) => l.includes('description'));
      expect(addedLine).toContain('+ description: World');
    });

    test('ends with a trailing empty console.log call', () => {
      // Arrange
      const a = { title: 'Hello' };
      const b = { title: 'Hello', extra: 'new' };

      // Act
      printFlatDiff(a, b);

      // Assert
      expect(logSpy.mock.calls.at(-1)).toEqual([]);
    });
  });

  describe('when data has diffs, added, and removed keys combined', () => {
    test('logs changed key, removed key, and added key', () => {
      // Arrange
      const a = { title: 'Old', removed: 'gone' };
      const b = { title: 'New', added: 'here' };

      // Act
      printFlatDiff(a, b);

      // Assert
      const logs = strippedLogs(logSpy);
      expect(logs.some((l) => l.includes('title'))).toBe(true);
      expect(logs.some((l) => l.includes('- Old Title') || l.includes('- Old'))).toBe(true);
      expect(logs.some((l) => l.includes('- removed: gone'))).toBe(true);
      expect(logs.some((l) => l.includes('+ added: here'))).toBe(true);
    });
  });
});

describe('buildFlatDiffLines', () => {
  test('returns a single identical line for identical data', () => {
    const lines = buildFlatDiffLines({ title: 'Hello' }, { title: 'Hello' }).map(ansis.strip);

    expect(lines).toEqual(['✓ identical\n']);
  });

  test('returns changed, removed, added and trailing blank entries as pure data', () => {
    const lines = buildFlatDiffLines({ title: 'Old', removed: 'gone' }, { title: 'New', added: 'here' }).map(
      ansis.strip,
    );

    expect(lines).toContain('  title');
    expect(lines).toContain('    - Old');
    expect(lines).toContain('    + New');
    expect(lines).toContain('  - removed: gone');
    expect(lines).toContain('  + added: here');
    expect(lines.at(-1)).toBe('');
  });
});
