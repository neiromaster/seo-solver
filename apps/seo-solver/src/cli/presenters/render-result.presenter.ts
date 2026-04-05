import type { EditorLauncher } from '#adapters/editor';
import type { RenderResult } from '#kernel';

export type RenderResultPresenter = {
  present(result: RenderResult, options?: { editor?: string }): Promise<number>;
};

export type RenderResultPresenterDeps = {
  writeStdout: (text: string) => void;
  editorLauncher: EditorLauncher;
};

export function createRenderResultPresenter(deps: RenderResultPresenterDeps): RenderResultPresenter {
  return {
    async present(result, options = {}) {
      if (result.kind === 'text') {
        deps.writeStdout(ensureTrailingNewline(result.content));
        return result.exitCode ?? 0;
      }

      if (result.kind === 'file') {
        if (options.editor) {
          await deps.editorLauncher.ensureAvailable(options.editor);
          await deps.editorLauncher.open(options.editor, [result.path]);
        } else {
          deps.writeStdout(`${result.path}\n`);
        }

        return result.exitCode ?? 0;
      }

      if (options.editor) {
        await deps.editorLauncher.ensureAvailable(options.editor);

        if (result.viewerHint === 'diff' && result.paths.length === 2) {
          const [leftPath, rightPath] = result.paths;
          await deps.editorLauncher.open(options.editor, ['--diff', leftPath as string, rightPath as string]);
        } else {
          await deps.editorLauncher.open(options.editor, result.paths);
        }
      } else {
        deps.writeStdout(`${result.paths.join('\n')}\n`);
      }

      return result.exitCode ?? 0;
    },
  };
}

function ensureTrailingNewline(value: string): string {
  return value.endsWith('\n') ? value : `${value}\n`;
}
