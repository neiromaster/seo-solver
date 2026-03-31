import { expect, mock, test } from 'bun:test';
import { createRenderResultPresenter } from './render-result.presenter';

test('presents text results to stdout and returns exit code', async () => {
  const writeStdout = mock(() => undefined);
  const presenter = createRenderResultPresenter({
    writeStdout,
    editorLauncher: {
      ensureAvailable: mock(async () => undefined),
      open: mock(async () => undefined),
    },
  });

  const exitCode = await presenter.present({ kind: 'text', content: 'hello', exitCode: 3 });

  expect(exitCode).toBe(3);
  expect(writeStdout).toHaveBeenCalledWith('hello\n');
});

test('prints single file path when no editor is configured', async () => {
  const writeStdout = mock(() => undefined);
  const presenter = createRenderResultPresenter({
    writeStdout,
    editorLauncher: {
      ensureAvailable: mock(async () => undefined),
      open: mock(async () => undefined),
    },
  });

  const exitCode = await presenter.present({ kind: 'file', path: '/tmp/inspect.json' });

  expect(exitCode).toBe(0);
  expect(writeStdout).toHaveBeenCalledWith('/tmp/inspect.json\n');
});

test('opens single file through editor launcher when editor is configured', async () => {
  const writeStdout = mock(() => undefined);
  const ensureAvailable = mock(async () => undefined);
  const open = mock(async () => undefined);
  const presenter = createRenderResultPresenter({
    writeStdout,
    editorLauncher: { ensureAvailable, open },
  });

  await presenter.present({ kind: 'file', path: '/tmp/inspect.json' }, { editor: 'code' });

  expect(ensureAvailable).toHaveBeenCalledWith('code');
  expect(open).toHaveBeenCalledWith('code', ['/tmp/inspect.json']);
  expect(writeStdout).not.toHaveBeenCalled();
});

test('opens diff bundles through editor launcher with --diff', async () => {
  const writeStdout = mock(() => undefined);
  const ensureAvailable = mock(async () => undefined);
  const open = mock(async () => undefined);
  const presenter = createRenderResultPresenter({
    writeStdout,
    editorLauncher: { ensureAvailable, open },
  });

  await presenter.present(
    {
      kind: 'files',
      paths: ['/tmp/left.json', '/tmp/right.json'],
      viewerHint: 'diff',
    },
    { editor: 'code' },
  );

  expect(ensureAvailable).toHaveBeenCalledWith('code');
  expect(open).toHaveBeenCalledWith('code', ['--diff', '/tmp/left.json', '/tmp/right.json']);
});

test('prints multi-file artifacts when no editor is configured', async () => {
  const writeStdout = mock(() => undefined);
  const presenter = createRenderResultPresenter({
    writeStdout,
    editorLauncher: {
      ensureAvailable: mock(async () => undefined),
      open: mock(async () => undefined),
    },
  });

  await presenter.present({ kind: 'files', paths: ['/tmp/a.json', '/tmp/b.json'], viewerHint: 'diff' });

  expect(writeStdout).toHaveBeenCalledWith('/tmp/a.json\n/tmp/b.json\n');
});
