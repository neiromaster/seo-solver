import { expect, mock, test } from 'bun:test';
import { createEditorLauncher } from './editor-launcher';

test('editor launcher checks editor availability via version command', async () => {
  const run = mock(async () => undefined);
  const launcher = createEditorLauncher({ run });

  await launcher.ensureAvailable('code');

  expect(run).toHaveBeenCalledWith('code', ['--version'], { stdio: 'ignore' });
});

test('editor launcher opens editor with inherited stdio', async () => {
  const run = mock(async () => undefined);
  const launcher = createEditorLauncher({ run });

  await launcher.open('code', ['--diff', 'left.json', 'right.json']);

  expect(run).toHaveBeenCalledWith('code', ['--diff', 'left.json', 'right.json'], { stdio: 'inherit' });
});

test('editor launcher raises a clear error when editor is unavailable', async () => {
  const run = mock(async () => {
    throw new Error('missing');
  });
  const launcher = createEditorLauncher({ run });

  await expect(launcher.ensureAvailable('cursor')).rejects.toThrow('Could not find editor `cursor` in PATH.');
});
