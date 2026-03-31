import { expect, mock, test } from 'bun:test';
import { createTerminalPresenter } from './terminal.presenter';

test('terminal presenter delegates to render result presenter contract', async () => {
  const writeStdout = mock(() => undefined);
  const presenter = createTerminalPresenter({
    writeStdout,
    editorLauncher: {
      ensureAvailable: mock(async () => undefined),
      open: mock(async () => undefined),
    },
  });

  const exitCode = await presenter.present({ kind: 'text', content: 'terminal output' });

  expect(exitCode).toBe(0);
  expect(writeStdout).toHaveBeenCalledWith('terminal output\n');
});
