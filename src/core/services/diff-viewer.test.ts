import { describe, expect, mock, test } from 'bun:test';
import { createDiffViewer } from './diff-viewer';

describe('createDiffViewer', () => {
  test('checks editor availability through formatter helper', () => {
    const mockEnsureEditorAvailable = mock(() => undefined);
    const viewer = createDiffViewer({
      ensureEditorAvailable: mockEnsureEditorAvailable,
      formatSchemasForDiff: mock(() => 'unused'),
      openEditorDiff: mock(() => undefined),
      openEditorFile: mock(() => undefined),
    });

    viewer.ensureEditorAvailable('cursor');

    expect(mockEnsureEditorAvailable).toHaveBeenCalledWith('cursor');
  });

  test('opens OpenGraph diff using JSON serialization', () => {
    const mockOpenEditorDiff = mock(() => undefined);
    const viewer = createDiffViewer({
      ensureEditorAvailable: mock(() => undefined),
      formatSchemasForDiff: mock(() => 'unused'),
      openEditorDiff: mockOpenEditorDiff,
      openEditorFile: mock(() => undefined),
    });

    viewer.openOgDiff({ 'og:title': 'A' }, { 'og:title': 'B' }, { url1: 'u1', url2: 'u2' }, 'code');

    expect(mockOpenEditorDiff).toHaveBeenCalledWith(
      'code',
      JSON.stringify({ 'og:title': 'A' }, null, 2),
      JSON.stringify({ 'og:title': 'B' }, null, 2),
      'og',
      'u1',
      'u2',
    );
  });

  test('opens schema diff using formatted schema strings', () => {
    const mockFormatSchemasForDiff = mock((schemas: unknown) => JSON.stringify(schemas));
    const mockOpenEditorDiff = mock(() => undefined);
    const viewer = createDiffViewer({
      ensureEditorAvailable: mock(() => undefined),
      formatSchemasForDiff: mockFormatSchemasForDiff,
      openEditorDiff: mockOpenEditorDiff,
      openEditorFile: mock(() => undefined),
    });

    const left = [{ '@type': 'Article' }];
    const right = [{ '@type': 'Product' }];
    viewer.openSchemasDiff(left, right, { url1: 'u1', url2: 'u2' }, 'cursor');

    expect(mockFormatSchemasForDiff).toHaveBeenCalledTimes(2);
    expect(mockOpenEditorDiff).toHaveBeenCalledWith(
      'cursor',
      JSON.stringify(left),
      JSON.stringify(right),
      'schema',
      'u1',
      'u2',
    );
  });

  test('opens a single OpenGraph payload as json', () => {
    const mockOpenEditorFile = mock(() => undefined);
    const viewer = createDiffViewer({
      ensureEditorAvailable: mock(() => undefined),
      formatSchemasForDiff: mock(() => 'unused'),
      openEditorDiff: mock(() => undefined),
      openEditorFile: mockOpenEditorFile,
    });

    viewer.openOg({ 'og:title': 'A' }, 'https://example.com', 'surf');

    expect(mockOpenEditorFile).toHaveBeenCalledWith(
      'surf',
      JSON.stringify({ 'og:title': 'A' }, null, 2),
      'og',
      'https://example.com',
      'json',
    );
  });

  test('opens a single schema payload as json', () => {
    const mockFormatSchemasForDiff = mock((schemas: unknown) => JSON.stringify(schemas));
    const mockOpenEditorFile = mock(() => undefined);
    const viewer = createDiffViewer({
      ensureEditorAvailable: mock(() => undefined),
      formatSchemasForDiff: mockFormatSchemasForDiff,
      openEditorDiff: mock(() => undefined),
      openEditorFile: mockOpenEditorFile,
    });

    viewer.openSchemas([{ '@type': 'Article' }], 'https://example.com', 'code');

    expect(mockOpenEditorFile).toHaveBeenCalledWith(
      'code',
      JSON.stringify([{ '@type': 'Article' }]),
      'schema',
      'https://example.com',
      'json',
    );
  });
});
