import {
  formatSchemasForDiff as formatSchemasForDiffDefault,
  openVscodeDiff as openVscodeDiffDefault,
} from '#core/formatters';
import type { OgData, Schema } from '#types';

export type DiffViewer = {
  openOgDiff(left: OgData, right: OgData, labels: { url1: string; url2: string }): void;
  openSchemasDiff(left: Schema[], right: Schema[], labels: { url1: string; url2: string }): void;
};

export type DiffViewerDeps = {
  formatSchemasForDiff: typeof formatSchemasForDiffDefault;
  openVscodeDiff: typeof openVscodeDiffDefault;
};

const defaultDiffViewerDeps: DiffViewerDeps = {
  formatSchemasForDiff: formatSchemasForDiffDefault,
  openVscodeDiff: openVscodeDiffDefault,
};

export function createDiffViewer(deps: DiffViewerDeps = defaultDiffViewerDeps): DiffViewer {
  return {
    openOgDiff(left, right, { url1, url2 }) {
      deps.openVscodeDiff(JSON.stringify(left, null, 2), JSON.stringify(right, null, 2), 'og', url1, url2);
    },

    openSchemasDiff(left, right, { url1, url2 }) {
      deps.openVscodeDiff(deps.formatSchemasForDiff(left), deps.formatSchemasForDiff(right), 'schema', url1, url2);
    },
  };
}
