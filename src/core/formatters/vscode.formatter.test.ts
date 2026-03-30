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
    const schemas = [{ '@type': 'Person', name: 'Alice' }];

    const result = formatSchemasForDiff(schemas);

    expect(JSON.parse(result)).toEqual(schemas);
  });

  test('sorts schemas alphabetically by @type', () => {
    const schemas = [{ '@type': 'WebSite' }, { '@type': 'Article' }, { '@type': 'BreadcrumbList' }];

    const result = formatSchemasForDiff(schemas);

    const parsed = JSON.parse(result) as Array<{ '@type': string }>;
    expect(parsed.map((s) => s['@type'])).toEqual(['Article', 'BreadcrumbList', 'WebSite']);
  });

  test('treats missing @type as empty string, sorting it first', () => {
    const schemas = [{ '@type': 'Article', name: 'post' }, { name: 'no type' }];

    const result = formatSchemasForDiff(schemas);

    const parsed = JSON.parse(result) as Array<Record<string, unknown>>;
    expect(parsed[0]).toEqual({ name: 'no type' });
    expect(parsed[1]).toBeDefined();
    expect(parsed[1]!['@type']).toBe('Article');
  });

  test('does not mutate the input array', () => {
    const schemas = [{ '@type': 'Z' }, { '@type': 'A' }];
    const snapshot = [...schemas];

    formatSchemasForDiff(schemas);

    expect(schemas).toEqual(snapshot);
  });

  test('returns 2-space indented JSON after sorting', () => {
    const schemas = [
      { '@type': 'WebSite', value: 1 },
      { '@type': 'Article', value: 2 },
    ];

    const result = formatSchemasForDiff(schemas);

    expect(result).toBe(
      JSON.stringify(
        [
          { '@type': 'Article', value: 2 },
          { '@type': 'WebSite', value: 1 },
        ],
        null,
        2,
      ),
    );
  });

  test('handles an empty array', () => {
    const schemas: never[] = [];

    const result = formatSchemasForDiff(schemas);

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
    const f1 = join('/tmp', 'diff_label1.json');

    openVscodeDiff('content-one', 'content-two', 'diff', 'label1', 'label2');

    expect(mockWriteFileSync).toHaveBeenNthCalledWith(1, f1, 'content-one', 'utf8');
  });

  test('writes content2 to the second temp file with utf8 encoding', () => {
    const f2 = join('/tmp', 'diff_label2.json');

    openVscodeDiff('content-one', 'content-two', 'diff', 'label1', 'label2');

    expect(mockWriteFileSync).toHaveBeenNthCalledWith(2, f2, 'content-two', 'utf8');
  });

  test('calls execFileSync with code --diff and both temp file paths', () => {
    const f1 = join('/tmp', 'diff_label1.json');
    const f2 = join('/tmp', 'diff_label2.json');

    openVscodeDiff('a', 'b', 'diff', 'label1', 'label2');

    expect(mockExecFileSync).toHaveBeenNthCalledWith(1, 'code', ['--diff', f1, f2], { stdio: 'inherit' });
  });

  test('passes stdio: inherit to execFileSync', () => {
    openVscodeDiff('a', 'b', 'diff', 'label1', 'label2');

    expect(mockExecFileSync).toHaveBeenCalledWith(
      'code',
      ['--diff', join('/tmp', 'diff_label1.json'), join('/tmp', 'diff_label2.json')],
      {
        stdio: 'inherit',
      },
    );
  });

  test('logs the saved file paths', () => {
    const f1 = join('/tmp', 'diff_label1.json');
    const f2 = join('/tmp', 'diff_label2.json');

    openVscodeDiff('a', 'b', 'diff', 'label1', 'label2');

    const logged = logSpy.mock.calls[0]?.[0];
    expect(logged).toBeDefined();
    expect(logged).toContain(f1);
    expect(logged).toContain(f2);
    expect(logged).toContain('Saved:');
  });

  test('logs an error message when code CLI is not available', () => {
    mockExecFileSync.mockImplementation(() => {
      throw new Error('ENOENT');
    });

    openVscodeDiff('a', 'b', 'diff', 'label1', 'label2');

    expect(errorSpy).toHaveBeenCalledWith('Could not open VS Code. Make sure `code` CLI is in PATH.');
  });

  test('does not throw when code CLI is not available', () => {
    mockExecFileSync.mockImplementation(() => {
      throw new Error('ENOENT');
    });

    expect(() => openVscodeDiff('a', 'b', 'diff', 'label1', 'label2')).not.toThrow();
  });

  test('builds file paths using the prefix and url-slugged labels', () => {
    const f1 = join('/tmp', 'report_example_com.json');
    const f2 = join('/tmp', 'report_other_com.json');

    openVscodeDiff('x', 'y', 'report', 'https://example.com', 'https://other.com');

    expect(mockWriteFileSync).toHaveBeenNthCalledWith(1, f1, 'x', 'utf8');
    expect(mockWriteFileSync).toHaveBeenNthCalledWith(2, f2, 'y', 'utf8');
  });

  test('uses a distinct second temp file when both labels slug to the same path', () => {
    const f1 = join('/tmp', 'report_example_com.json');
    const f2 = join('/tmp', 'report_example_com_2.json');

    openVscodeDiff('x', 'y', 'report', 'https://example.com', 'https://example.com');

    expect(mockWriteFileSync).toHaveBeenNthCalledWith(1, f1, 'x', 'utf8');
    expect(mockWriteFileSync).toHaveBeenNthCalledWith(2, f2, 'y', 'utf8');
    expect(mockExecFileSync).toHaveBeenNthCalledWith(1, 'code', ['--diff', f1, f2], { stdio: 'inherit' });
  });
});
