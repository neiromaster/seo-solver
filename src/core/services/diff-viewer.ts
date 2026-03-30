import {
  ensureEditorAvailable as ensureEditorAvailableDefault,
  formatSchemasForDiff as formatSchemasForDiffDefault,
  openEditorDiff as openEditorDiffDefault,
  openEditorFile as openEditorFileDefault,
} from '#core/formatters';
import type { OgData, Schema } from '#types';

export type DiffViewer = {
  ensureEditorAvailable(editor: string): void;
  openOgDiff(left: OgData, right: OgData, labels: { url1: string; url2: string }, editor: string): void;
  openSchemasDiff(left: Schema[], right: Schema[], labels: { url1: string; url2: string }, editor: string): void;
  openOg(data: OgData, label: string, editor: string): void;
  openSchemas(data: Schema[], label: string, editor: string): void;
};

export type DiffViewerDeps = {
  ensureEditorAvailable: typeof ensureEditorAvailableDefault;
  formatSchemasForDiff: typeof formatSchemasForDiffDefault;
  openEditorDiff: typeof openEditorDiffDefault;
  openEditorFile: typeof openEditorFileDefault;
};

const defaultDiffViewerDeps: DiffViewerDeps = {
  ensureEditorAvailable: ensureEditorAvailableDefault,
  formatSchemasForDiff: formatSchemasForDiffDefault,
  openEditorDiff: openEditorDiffDefault,
  openEditorFile: openEditorFileDefault,
};

export function createDiffViewer(deps: DiffViewerDeps = defaultDiffViewerDeps): DiffViewer {
  return {
    ensureEditorAvailable(editor) {
      deps.ensureEditorAvailable(editor);
    },

    openOgDiff(left, right, { url1, url2 }, editor) {
      deps.openEditorDiff(editor, JSON.stringify(left, null, 2), JSON.stringify(right, null, 2), 'og', url1, url2);
    },

    openSchemasDiff(left, right, { url1, url2 }, editor) {
      deps.openEditorDiff(
        editor,
        deps.formatSchemasForDiff(left),
        deps.formatSchemasForDiff(right),
        'schema',
        url1,
        url2,
      );
    },

    openOg(data, label, editor) {
      deps.openEditorFile(editor, JSON.stringify(data, null, 2), 'og', label, 'json');
    },

    openSchemas(data, label, editor) {
      deps.openEditorFile(editor, deps.formatSchemasForDiff(data), 'schema', label, 'json');
    },
  };
}
