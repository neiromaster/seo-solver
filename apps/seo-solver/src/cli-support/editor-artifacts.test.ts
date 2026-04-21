import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { buildExtractEditorArtifact, writeCompareEditorArtifacts } from './editor-artifacts.js';

describe('editor artifacts', () => {
  test('builds stable json with sorted nested keys', () => {
    const output = buildExtractEditorArtifact({
      source: { url: 'https://example.com', timing: 1, statusCode: 200 },
      data: {
        meta: {
          zeta: 'last',
          alpha: 'first',
        },
      },
      errors: [],
    } as never);

    expect(output).toContain('"alpha"');
    expect(output.indexOf('"alpha"')).toBeLessThan(output.indexOf('"zeta"'));
  });

  test('writes compare artifacts into separate files', async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), 'seo-solver-editor-artifacts-'));
    const previousTmpdir = process.env.TMPDIR;
    process.env.TMPDIR = tempRoot;

    try {
      const { leftPath, rightPath } = await writeCompareEditorArtifacts(
        {
          source: { url: 'https://example.com/a', timing: 1, statusCode: 200 },
          data: { meta: { title: 'A' } },
          errors: [],
        } as never,
        {
          source: { url: 'https://example.com/b', timing: 1, statusCode: 200 },
          data: { meta: { title: 'B' } },
          errors: [],
        } as never,
      );

      expect(leftPath).toContain('left.json');
      expect(rightPath).toContain('right.json');
      expect(leftPath).not.toBe(rightPath);
    } finally {
      if (previousTmpdir === undefined) {
        delete process.env.TMPDIR;
      } else {
        process.env.TMPDIR = previousTmpdir;
      }
    }
  });
});
