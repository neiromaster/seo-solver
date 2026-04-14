import { chmod, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export async function createFakeEditor(): Promise<{ editorPath: string; logPath: string }> {
  const directory = await mkdtemp(join(tmpdir(), 'seo-solver-fake-editor-'));
  const editorPath = join(directory, 'fake-editor');
  const logPath = join(directory, 'editor-log.json');

  await writeFile(
    editorPath,
    `#!/bin/sh
for arg in "$@"; do
  printf '%s\t' "$arg" >> "$FAKE_EDITOR_LOG_PATH"
done
printf '\n' >> "$FAKE_EDITOR_LOG_PATH"
`,
    'utf8',
  );
  await chmod(editorPath, 0o755);

  return { editorPath, logPath };
}

export async function readFakeEditorLog(logPath: string): Promise<Array<{ args: string[] }>> {
  const content = await readFile(logPath, 'utf8').catch(() => '');
  return content
    .split('\n')
    .filter(Boolean)
    .map((line) => ({ args: line.split('\t').filter(Boolean) }));
}
