import { spawn } from 'node:child_process';

export type EditorLauncher = {
  ensureAvailable(editor: string): Promise<void>;
  open(editor: string, args: string[]): Promise<void>;
};

export type EditorLauncherDeps = {
  run: (file: string, args: string[], options?: { stdio?: 'ignore' | 'inherit' }) => Promise<void>;
};

export function createEditorLauncher(
  deps: EditorLauncherDeps = {
    run: (file, args, options) =>
      new Promise<void>((resolve, reject) => {
        const child = spawn(file, args, {
          stdio: options?.stdio ?? 'inherit',
        });

        child.once('error', reject);
        child.once('exit', (code) => {
          if (code === 0) {
            resolve();
            return;
          }

          reject(new Error(`Process exited with code ${code ?? 'unknown'}`));
        });
      }),
  },
): EditorLauncher {
  return {
    async ensureAvailable(editor) {
      try {
        await deps.run(editor, ['--version'], { stdio: 'ignore' });
      } catch {
        throw new Error(`Could not find editor \`${editor}\` in PATH.`);
      }
    },
    async open(editor, args) {
      try {
        await deps.run(editor, args, { stdio: 'inherit' });
      } catch {
        throw new Error(`Could not open editor \`${editor}\`. Make sure it is in PATH.`);
      }
    },
  };
}
