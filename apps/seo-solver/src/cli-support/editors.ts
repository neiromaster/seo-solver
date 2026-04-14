export type EditorId = 'code' | 'cursor' | 'surf' | 'zed';

export type EditorDefinition = {
  editor: EditorId;
  command: string;
  openCommand?: string[];
  diffCommand?: string[];
};

const editorEnvVarNames: Record<EditorId, string> = {
  code: 'SEO_SOLVER_EDITOR_CODE_BIN',
  cursor: 'SEO_SOLVER_EDITOR_CURSOR_BIN',
  surf: 'SEO_SOLVER_EDITOR_SURF_BIN',
  zed: 'SEO_SOLVER_EDITOR_ZED_BIN',
};

export const editorDefinitions = [
  {
    editor: 'code',
    command: 'code',
    diffCommand: ['--diff'],
  },
  {
    editor: 'cursor',
    command: 'cursor',
    diffCommand: ['--diff'],
  },
  {
    editor: 'surf',
    command: 'surf',
    diffCommand: ['--diff'],
  },
  {
    editor: 'zed',
    command: 'zed',
    diffCommand: ['diff'],
  },
] as const satisfies readonly EditorDefinition[];

export function getSupportedEditorIds(): EditorId[] {
  return editorDefinitions.map((definition) => definition.editor);
}

export function getEditorDefinition(editor: EditorId): EditorDefinition {
  const definition = editorDefinitions.find((entry) => entry.editor === editor);

  if (!definition) {
    throw new Error(`Unknown editor: ${editor}`);
  }

  return definition;
}

export function resolveEditorCommand(definition: EditorDefinition): string {
  return process.env[editorEnvVarNames[definition.editor]] ?? definition.command;
}
