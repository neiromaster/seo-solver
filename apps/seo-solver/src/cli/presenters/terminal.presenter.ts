import type { EditorLauncher } from '#adapters/editor';
import { createRenderResultPresenter, type RenderResultPresenter } from './render-result.presenter';

export function createTerminalPresenter(deps: {
  writeStdout: (text: string) => void;
  editorLauncher: EditorLauncher;
}): RenderResultPresenter {
  return createRenderResultPresenter(deps);
}
