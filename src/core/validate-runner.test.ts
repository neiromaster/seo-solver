import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test';
import type { OgData, Schema } from '#types';
import { type CreateRunValidateDeps, createRunValidate, type ValidateOptions } from './validate-runner';

const mockReadOg = mock(async () => ({}) as OgData);
const mockReadSchemas = mock(async () => [] as Schema[]);
const mockEnsureEditorAvailable = mock(() => undefined);
const mockOpenOg = mock(() => undefined);
const mockOpenSchemas = mock(() => undefined);
const mockSchemaValidatorValidate = mock(async () => undefined);
let runValidate: (url: string, options: ValidateOptions) => Promise<void>;

const URL = 'https://example.com';
const OG_DATA: OgData = { 'og:title': 'Page' };
const SCHEMAS: Schema[] = [{ '@type': 'Article', name: 'Test' }];

function stripAnsi(value: string): string {
  return value
    .replaceAll('\u001B[36m', '')
    .replaceAll('\u001B[39m', '')
    .replaceAll('\u001B[1m', '')
    .replaceAll('\u001B[22m', '')
    .replaceAll('\u001B[33m', '');
}

describe('runValidate', () => {
  let logSpy: ReturnType<typeof spyOn<typeof console, 'log'>>;

  beforeEach(() => {
    logSpy = spyOn(console, 'log').mockImplementation(() => {});
    mockReadOg.mockReset();
    mockReadSchemas.mockReset();
    mockEnsureEditorAvailable.mockReset();
    mockOpenOg.mockReset();
    mockOpenSchemas.mockReset();
    mockSchemaValidatorValidate.mockReset();

    mockReadOg.mockResolvedValue(OG_DATA);
    mockReadSchemas.mockResolvedValue(SCHEMAS);
    mockSchemaValidatorValidate.mockResolvedValue(undefined);

    const deps: CreateRunValidateDeps = {
      metadataReader: {
        readOg: mockReadOg,
        readSchemas: mockReadSchemas,
      },
      diffViewer: {
        ensureEditorAvailable: mockEnsureEditorAvailable,
        openOg: mockOpenOg,
        openSchemas: mockOpenSchemas,
        openOgDiff: mock(() => undefined),
        openSchemasDiff: mock(() => undefined),
      },
      schemaValidator: {
        validate: mockSchemaValidatorValidate,
      },
      log: console,
    };

    runValidate = createRunValidate(deps);
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  test('normalizes URL without scheme', async () => {
    await runValidate('example.com', { useCurl: true, useOg: true });

    expect(mockReadOg).toHaveBeenCalledWith('https://example.com', 'curl');
  });

  test('validates JSON-LD schemas', async () => {
    await runValidate(URL, { useCurl: true, useOg: false });

    expect(mockReadSchemas).toHaveBeenCalledWith(URL, 'curl');
    expect(mockSchemaValidatorValidate).toHaveBeenCalledWith(SCHEMAS);
  });

  test('reports unsupported OG validation', async () => {
    await runValidate(URL, { useCurl: true, useOg: true });

    const output = stripAnsi(logSpy.mock.calls.map((args) => String(args[0] ?? '')).join('\n'));
    expect(output).toContain('OpenGraph validation not supported');
  });

  test('checks editor availability before fetching when editor is provided', async () => {
    await runValidate(URL, { useCurl: false, useOg: false, editor: 'cursor' });

    expect(mockEnsureEditorAvailable).toHaveBeenCalledWith('cursor');
    expect(mockReadSchemas).toHaveBeenCalled();
  });

  test('fails before fetching when editor check throws', async () => {
    mockEnsureEditorAvailable.mockImplementation(() => {
      throw new Error('missing editor');
    });

    await expect(runValidate(URL, { useCurl: true, useOg: false, editor: 'missing' })).rejects.toThrow(
      'missing editor',
    );
    expect(mockReadSchemas).not.toHaveBeenCalled();
  });

  test('opens extracted schemas in selected editor', async () => {
    await runValidate(URL, { useCurl: true, useOg: false, editor: 'code' });

    expect(mockOpenSchemas).toHaveBeenCalledWith(SCHEMAS, URL, 'code');
  });

  test('opens extracted OpenGraph in selected editor', async () => {
    await runValidate(URL, { useCurl: false, useOg: true, editor: 'surf' });

    expect(mockOpenOg).toHaveBeenCalledWith(OG_DATA, URL, 'surf');
    expect(mockSchemaValidatorValidate).not.toHaveBeenCalled();
  });

  test('does not open editor when editor option is absent', async () => {
    await runValidate(URL, { useCurl: true, useOg: false });

    expect(mockOpenSchemas).not.toHaveBeenCalled();
    expect(mockEnsureEditorAvailable).not.toHaveBeenCalled();
  });
});
