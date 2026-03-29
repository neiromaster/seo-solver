import { describe, expect, mock, test } from 'bun:test';
import { createDiffViewer } from './diff-viewer';

describe('createDiffViewer', () => {
  test('opens OpenGraph diff using JSON serialization', () => {
    const mockFormatSchemasForDiff = mock(() => 'unused');
    const mockOpenVscodeDiff = mock(() => undefined);
    const viewer = createDiffViewer({
      formatSchemasForDiff: mockFormatSchemasForDiff,
      openVscodeDiff: mockOpenVscodeDiff,
    });

    viewer.openOgDiff({ 'og:title': 'A' }, { 'og:title': 'B' }, { url1: 'u1', url2: 'u2' });

    expect(mockOpenVscodeDiff).toHaveBeenCalledWith(
      JSON.stringify({ 'og:title': 'A' }, null, 2),
      JSON.stringify({ 'og:title': 'B' }, null, 2),
      'og',
      'u1',
      'u2',
    );
    expect(mockFormatSchemasForDiff).not.toHaveBeenCalled();
  });

  test('opens schema diff using formatted schema strings', () => {
    const mockFormatSchemasForDiff = mock((schemas: unknown) => JSON.stringify(schemas));
    const mockOpenVscodeDiff = mock(() => undefined);
    const viewer = createDiffViewer({
      formatSchemasForDiff: mockFormatSchemasForDiff,
      openVscodeDiff: mockOpenVscodeDiff,
    });

    const left = [{ '@type': 'Article' }];
    const right = [{ '@type': 'Product' }];
    viewer.openSchemasDiff(left, right, { url1: 'u1', url2: 'u2' });

    expect(mockFormatSchemasForDiff).toHaveBeenCalledTimes(2);
    expect(mockOpenVscodeDiff).toHaveBeenCalledWith(JSON.stringify(left), JSON.stringify(right), 'schema', 'u1', 'u2');
  });
});
