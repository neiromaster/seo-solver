import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test';
import type { OgData, Schema } from '#types';
import { type CreateRunDiffDeps, createRunDiff, type DiffOptions } from './diff-runner';

const mockReadOg = mock(async () => ({}) as OgData);
const mockReadSchemas = mock(async () => [] as Schema[]);
const mockCompareOg = mock(() => {});
const mockCompareJsonLd = mock(() => {});
const mockEnsureEditorAvailable = mock(() => undefined);
const mockOpenOgDiff = mock(() => undefined);
const mockOpenSchemasDiff = mock(() => undefined);
let runDiff: (url1: string, url2: string, options: DiffOptions) => Promise<void>;

const URL1 = 'https://example.com';
const URL2 = 'https://other.com';
const OG_DATA: OgData = { 'og:title': 'Page One' };
const SCHEMAS: Schema[] = [{ '@type': 'Article', name: 'Test' }];

function stripAnsi(value: string): string {
  return value
    .replaceAll('\u001B[36m', '')
    .replaceAll('\u001B[39m', '')
    .replaceAll('\u001B[1m', '')
    .replaceAll('\u001B[22m', '');
}

describe('runDiff', () => {
  let logSpy: ReturnType<typeof spyOn<typeof console, 'log'>>;

  beforeEach(() => {
    logSpy = spyOn(console, 'log').mockImplementation(() => {});
    mockReadOg.mockReset();
    mockReadSchemas.mockReset();
    mockCompareOg.mockReset();
    mockCompareJsonLd.mockReset();
    mockEnsureEditorAvailable.mockReset();
    mockOpenOgDiff.mockReset();
    mockOpenSchemasDiff.mockReset();

    mockReadOg.mockResolvedValue(OG_DATA);
    mockReadSchemas.mockResolvedValue(SCHEMAS);

    const deps: CreateRunDiffDeps = {
      metadataReader: {
        readOg: mockReadOg,
        readSchemas: mockReadSchemas,
      },
      diffViewer: {
        ensureEditorAvailable: mockEnsureEditorAvailable,
        openOg: mock(() => undefined),
        openSchemas: mock(() => undefined),
        openOgDiff: mockOpenOgDiff,
        openSchemasDiff: mockOpenSchemasDiff,
      },
      log: console,
      compareOg: mockCompareOg,
      compareJsonLd: mockCompareJsonLd,
    };

    runDiff = createRunDiff(deps);
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  test('fetches OG data for both URLs', async () => {
    await runDiff(URL1, URL2, { useCurl: true, useOg: true });

    expect(mockReadOg).toHaveBeenCalledTimes(2);
    expect(mockReadOg).toHaveBeenNthCalledWith(1, URL1, 'curl');
    expect(mockReadOg).toHaveBeenNthCalledWith(2, URL2, 'curl');
  });

  test('fetches schema data for both URLs', async () => {
    await runDiff(URL1, URL2, { useCurl: false, useOg: false });

    expect(mockReadSchemas).toHaveBeenCalledTimes(2);
    expect(mockCompareJsonLd).toHaveBeenCalledTimes(1);
  });

  test('checks editor availability before fetching when editor is provided', async () => {
    await runDiff(URL1, URL2, { useCurl: true, useOg: true, editor: 'cursor' });

    expect(mockEnsureEditorAvailable).toHaveBeenCalledWith('cursor');
    expect(mockReadOg).toHaveBeenCalled();
  });

  test('fails before fetching when editor check throws', async () => {
    mockEnsureEditorAvailable.mockImplementation(() => {
      throw new Error('missing editor');
    });

    await expect(runDiff(URL1, URL2, { useCurl: true, useOg: true, editor: 'missing' })).rejects.toThrow(
      'missing editor',
    );
    expect(mockReadOg).not.toHaveBeenCalled();
  });

  test('opens OG diff in selected editor', async () => {
    await runDiff(URL1, URL2, { useCurl: true, useOg: true, editor: 'code' });

    expect(mockOpenOgDiff).toHaveBeenCalledWith(OG_DATA, OG_DATA, { url1: URL1, url2: URL2 }, 'code');
  });

  test('opens schema diff in selected editor', async () => {
    await runDiff(URL1, URL2, { useCurl: true, useOg: false, editor: 'surf' });

    expect(mockOpenSchemasDiff).toHaveBeenCalledWith(SCHEMAS, SCHEMAS, { url1: URL1, url2: URL2 }, 'surf');
  });

  test('does not open editor when editor option is absent', async () => {
    await runDiff(URL1, URL2, { useCurl: true, useOg: false });

    expect(mockOpenSchemasDiff).not.toHaveBeenCalled();
    expect(mockEnsureEditorAvailable).not.toHaveBeenCalled();
  });

  test('logs mode banner', async () => {
    await runDiff(URL1, URL2, { useCurl: true, useOg: true });

    const output = stripAnsi(logSpy.mock.calls.map((args) => String(args[0] ?? '')).join('\n'));
    expect(output).toContain('Fetching OpenGraph metadata (curl/SSR)');
  });
});
