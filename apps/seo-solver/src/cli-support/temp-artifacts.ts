import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const editorArtifactPrefix = 'seo-solver-editor-';

export async function createEditorArtifactDirectory(): Promise<string> {
  return await mkdtemp(join(tmpdir(), editorArtifactPrefix));
}

export async function writeEditorArtifactFile(directory: string, fileName: string, content: string): Promise<string> {
  const filePath = join(directory, fileName);
  await writeFile(filePath, content, 'utf8');
  return filePath;
}
