import { expect, mock, test } from '#test-support/test-runtime';
import { createJsonPresenter } from './json.presenter';

test('json presenter delegates to render result presenter contract', async () => {
  const writeStdout = mock(() => undefined);
  const presenter = createJsonPresenter({
    writeStdout,
    editorLauncher: {
      ensureAvailable: mock(async () => undefined),
      open: mock(async () => undefined),
    },
  });

  const exitCode = await presenter.present({ kind: 'text', content: '{"ok":true}' });

  expect(exitCode).toBe(0);
  expect(writeStdout).toHaveBeenCalledWith('{"ok":true}\n');
});
