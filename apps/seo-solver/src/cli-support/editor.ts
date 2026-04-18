import { spawn } from 'node:child_process';
import { type EditorId, getEditorDefinition, resolveEditorCommand } from './editors.js';
import { CLIError } from './error-handler.js';

export async function openFileInEditor(editor: EditorId, filePath: string): Promise<void> {
  const definition = getEditorDefinition(editor);
  await runEditorProcess(resolveEditorCommand(definition), [...(definition.openCommand ?? []), filePath], editor);
}

export async function openDiffInEditor(editor: EditorId, leftPath: string, rightPath: string): Promise<void> {
  const definition = getEditorDefinition(editor);

  if (!definition.diffCommand) {
    throw new CLIError(`Editor '${editor}' does not support automated diff mode`);
  }

  await runEditorProcess(resolveEditorCommand(definition), [...definition.diffCommand, leftPath, rightPath], editor);
}

async function runEditorProcess(command: string, args: string[], editor: EditorId): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'ignore',
    });

    child.on('error', () => {
      reject(
        new CLIError(
          `Failed to launch editor '${editor}'. Make sure the '${command}' shell command is installed and available in PATH`,
        ),
      );
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new CLIError(`Editor '${editor}' exited with status ${code ?? 'unknown'}`));
    });
  });
}
