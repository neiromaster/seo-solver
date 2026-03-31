import type { TempFileStore } from '#adapters/filesystem';
import { AppError, type Renderer, type RenderPayload, type RenderResult } from '#kernel';

export class EditorDiffRenderer implements Renderer<RenderPayload> {
  readonly id = 'editor-diff';

  constructor(private readonly tempFileStore: TempFileStore) {}

  async render(input: RenderPayload): Promise<RenderResult> {
    if (input.mode === 'validate') {
      throw new AppError('Editor diff renderer does not support validate mode yet');
    }

    if (input.mode === 'inspect') {
      const file = await this.tempFileStore.writeFile(
        buildFileName(input.extractorId, input.document.source.url, 'json'),
        JSON.stringify(input.document.data, null, 2),
      );

      return {
        kind: 'file',
        path: file.path,
        exitCode: 0,
      };
    }

    const files = await this.tempFileStore.writeFiles([
      {
        fileName: buildFileName(input.extractorId, input.leftDocument.source.url, 'json'),
        content: JSON.stringify(input.leftDocument.data, null, 2),
      },
      {
        fileName: buildFileName(input.extractorId, input.rightDocument.source.url, 'json'),
        content: JSON.stringify(input.rightDocument.data, null, 2),
      },
    ]);

    return {
      kind: 'files',
      paths: files.map((file) => file.path),
      viewerHint: 'diff',
      exitCode: 0,
    };
  }
}

function buildFileName(prefix: string, label: string, extension: string): string {
  return `${prefix}_${slugify(label)}.${extension}`;
}

function slugify(value: string): string {
  return value
    .replace(/^https?:\/\//, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}
