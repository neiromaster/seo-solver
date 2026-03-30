import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test';
import { join } from 'node:path';

const mockWriteFileSync = mock();
const mockExecFileSync = mock();
let ensureEditorAvailable: typeof import('./vscode.formatter')['ensureEditorAvailable'];
let formatSchemasForDiff: typeof import('./vscode.formatter')['formatSchemasForDiff'];
let openEditorDiff: typeof import('./vscode.formatter')['openEditorDiff'];
let openEditorFile: typeof import('./vscode.formatter')['openEditorFile'];

beforeAll(async () => {
  mock.module('node:fs', () => ({ writeFileSync: mockWriteFileSync }));
  mock.module('node:child_process', () => ({ execFileSync: mockExecFileSync }));
  mock.module('node:os', () => ({ tmpdir: () => '/tmp' }));

  ({ ensureEditorAvailable, formatSchemasForDiff, openEditorDiff, openEditorFile } = await import(
    './vscode.formatter'
  ));
});

afterAll(() => {
  mock.restore();
});

describe('ensureEditorAvailable', () => {
  test('checks editor availability using --version', () => {
    ensureEditorAvailable('cursor');

    expect(mockExecFileSync).toHaveBeenCalledWith('cursor', ['--version'], { stdio: 'ignore' });
  });

  test('throws a clear error when editor is missing', () => {
    mockExecFileSync.mockImplementation(() => {
      throw new Error('ENOENT');
    });

    expect(() => ensureEditorAvailable('missing-editor')).toThrow('Could not find editor `missing-editor` in PATH.');
  });
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
});

describe('openEditorDiff', () => {
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

  test('writes both temp files and opens diff with selected editor', () => {
    const f1 = join('/tmp', 'diff_label1.json');
    const f2 = join('/tmp', 'diff_label2.json');

    openEditorDiff('cursor', 'a', 'b', 'diff', 'label1', 'label2');

    expect(mockWriteFileSync).toHaveBeenNthCalledWith(1, f1, 'a', 'utf8');
    expect(mockWriteFileSync).toHaveBeenNthCalledWith(2, f2, 'b', 'utf8');
    expect(mockExecFileSync).toHaveBeenCalledWith('cursor', ['--diff', f1, f2], { stdio: 'inherit' });
  });

  test('logs an error message when editor launch fails', () => {
    mockExecFileSync.mockImplementation((command: string, args: string[]) => {
      if (args[0] === '--diff') throw new Error('ENOENT');
      return undefined as never;
    });

    openEditorDiff('surf', 'a', 'b', 'diff', 'label1', 'label2');

    expect(errorSpy).toHaveBeenCalledWith('Could not open editor `surf`. Make sure it is in PATH.');
  });
});

describe('openEditorFile', () => {
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

  test('writes a single temp file and opens it in the selected editor', () => {
    const filePath = join('/tmp', 'schema_example_com.json');

    openEditorFile('code', '{"ok":true}', 'schema', 'https://example.com', 'json');

    expect(mockWriteFileSync).toHaveBeenCalledWith(filePath, '{"ok":true}', 'utf8');
    expect(mockExecFileSync).toHaveBeenCalledWith('code', [filePath], { stdio: 'inherit' });
  });

  test('logs the saved file path', () => {
    const filePath = join('/tmp', 'schema_example_com.json');

    openEditorFile('cursor', '{"ok":true}', 'schema', 'https://example.com', 'json');

    expect(logSpy).toHaveBeenCalledWith(`\nSaved:\n  ${filePath}`);
  });
});
