import { describe, expect, test } from 'vitest';
import { createEditorArtifactDirectory } from './temp-artifacts';

describe('temp editor artifacts', () => {
  test('creates editor artifact directories under temp storage', async () => {
    const directory = await createEditorArtifactDirectory();

    expect(directory).toContain('seo-solver-editor-');
  });
});
