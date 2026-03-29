import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test';
import { join } from 'node:path';

const mockWriteFileSync = mock();
const mockExecFileSync = mock();
let formatSchemasForDiff: typeof import('./vscode.formatter')['formatSchemasForDiff'];
let openVscodeDiff: typeof import('./vscode.formatter')['openVscodeDiff'];

beforeAll(async () => {
  mock.module('node:fs', () => ({ writeFileSync: mockWriteFileSync }));
  mock.module('node:child_process', () => ({ execFileSync: mockExecFileSync }));
  mock.module('node:os', () => ({ tmpdir: () => '/tmp' }));

  ({ formatSchemasForDiff, openVscodeDiff } = await import('./vscode.formatter'));
});

afterAll(() => {
  mock.restore();
});

describe('formatSchemasForDiff', () => {
  test('returns a valid JSON string', () => {
    // Arrange
    const schemas = [{ '@type': 'Person', name: 'Alice' }];

    // Act
    const result = formatSchemasForDiff(schemas);

    // Assert
    expect(JSON.parse(result)).toEqual(schemas);
  });

  test('sorts schemas alphabetically by @type', () => {
    // Arrange
    const schemas = [{ '@type': 'WebSite' }, { '@type': 'Article' }, { '@type': 'BreadcrumbList' }];

    // Act
    const result = formatSchemasForDiff(schemas);

    // Assert
    const parsed = JSON.parse(result) as Array<{ '@type': string }>;
    expect(parsed.map((s) => s['@type'])).toEqual(['Article', 'BreadcrumbList', 'WebSite']);
  });

  test('treats missing @type as empty string, sorting it first', () => {
    // Arrange
    const schemas = [{ '@type': 'Article', name: 'post' }, { name: 'no type' }];

    // Act
    const result = formatSchemasForDiff(schemas);

    // Assert
    const parsed = JSON.parse(result) as Array<Record<string, unknown>>;
    expect(parsed[0]).toEqual({ name: 'no type' });
    expect(parsed[1]).toBeDefined();
    expect(parsed[1]!['@type']).toBe('Article');
  });

  test('does not mutate the input array', () => {
    // Arrange
    const schemas = [{ '@type': 'Z' }, { '@type': 'A' }];
    const snapshot = [...schemas];

    // Act
    formatSchemasForDiff(schemas);

    // Assert
    expect(schemas).toEqual(snapshot);
  });

  test('returns 2-space indented JSON', () => {
    // Arrange
    const schemas = [{ '@type': 'Thing', value: 1 }];

    // Act
    const result = formatSchemasForDiff(schemas);

    // Assert
    expect(result).toBe(JSON.stringify(schemas, null, 2));
  });

  test('handles an empty array', () => {
    // Arrange
    const schemas: never[] = [];

    // Act
    const result = formatSchemasForDiff(schemas);

    // Assert
    expect(result).toBe('[]');
  });
});

describe('openVscodeDiff', () => {
  let logSpy: ReturnType<typeof spyOn<typeof console, 'log'>>;
  let errorSpy: ReturnType<typeof spyOn<typeof console, 'error'>>;

  beforeEach(() => {
    mockWriteFileSync.mockReset();
    mockExecFileSync.mockReset();
    logSpy = spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  test('writes content1 to the first temp file with utf8 encoding', () => {
    // Arrange
    const f1 = join('/tmp', 'diff_label1.json');

    // Act
    openVscodeDiff('content-one', 'content-two', 'diff', 'label1', 'label2');

    // Assert
    const [path, data, encoding] = mockWriteFileSync.mock.calls[0] as [string, string, string];
    expect(path).toBe(f1);
    expect(data).toBe('content-one');
    expect(encoding).toBe('utf8');
  });

  test('writes content2 to the second temp file with utf8 encoding', () => {
    // Arrange
    const f2 = join('/tmp', 'diff_label2.json');

    // Act
    openVscodeDiff('content-one', 'content-two', 'diff', 'label1', 'label2');

    // Assert
    const [path, data, encoding] = mockWriteFileSync.mock.calls[1] as [string, string, string];
    expect(path).toBe(f2);
    expect(data).toBe('content-two');
    expect(encoding).toBe('utf8');
  });

  test('calls execFileSync with code --diff and both temp file paths', () => {
    // Arrange
    const f1 = join('/tmp', 'diff_label1.json');
    const f2 = join('/tmp', 'diff_label2.json');

    // Act
    openVscodeDiff('a', 'b', 'diff', 'label1', 'label2');

    // Assert
    const [cmd, args] = mockExecFileSync.mock.calls[0] as [string, string[]];
    expect(cmd).toBe('code');
    expect(args).toEqual(['--diff', f1, f2]);
  });

  test('passes stdio: inherit to execFileSync', () => {
    // Arrange

    // Act
    openVscodeDiff('a', 'b', 'diff', 'label1', 'label2');

    // Assert
    const [, , opts] = mockExecFileSync.mock.calls[0] as [string, string[], Record<string, string>];
    expect(opts).toEqual({ stdio: 'inherit' });
  });

  test('logs the saved file paths', () => {
    // Arrange
    const f1 = join('/tmp', 'diff_label1.json');
    const f2 = join('/tmp', 'diff_label2.json');

    // Act
    openVscodeDiff('a', 'b', 'diff', 'label1', 'label2');

    // Assert
    const logged = logSpy.mock.calls[0]?.[0];
    expect(logged).toBeDefined();
    expect(logged).toContain(f1);
    expect(logged).toContain(f2);
    expect(logged).toContain('Saved:');
  });

  test('logs an error message when code CLI is not available', () => {
    // Arrange
    mockExecFileSync.mockImplementation(() => {
      throw new Error('ENOENT');
    });

    // Act
    openVscodeDiff('a', 'b', 'diff', 'label1', 'label2');

    // Assert
    expect(errorSpy).toHaveBeenCalledWith('Could not open VS Code. Make sure `code` CLI is in PATH.');
  });

  test('does not throw when code CLI is not available', () => {
    // Arrange
    mockExecFileSync.mockImplementation(() => {
      throw new Error('ENOENT');
    });

    // Act & Assert
    expect(() => openVscodeDiff('a', 'b', 'diff', 'label1', 'label2')).not.toThrow();
  });

  test('builds file paths using the prefix and url-slugged labels', () => {
    // Arrange
    const f1 = join('/tmp', 'report_example_com.json');

    // Act
    openVscodeDiff('x', 'y', 'report', 'https://example.com', 'https://other.com');

    // Assert
    const [path] = mockWriteFileSync.mock.calls[0] as [string];
    expect(path).toBe(f1);
  });
});
