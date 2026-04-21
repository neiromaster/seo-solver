import type { ExtractedPage } from '@seo-solver/types/extract';
import { createEditorArtifactDirectory, writeEditorArtifactFile } from './temp-artifacts.js';

export function buildExtractEditorArtifact(page: ExtractedPage): string {
  return stringifyStableJson({
    source: page.source,
    data: page.data,
    errors: page.errors,
  });
}

export async function writeCompareEditorArtifacts(
  leftPage: ExtractedPage,
  rightPage: ExtractedPage,
): Promise<{
  leftPath: string;
  rightPath: string;
}> {
  const directory = await createEditorArtifactDirectory();
  const leftPath = await writeEditorArtifactFile(directory, 'left.json', buildExtractEditorArtifact(leftPage));
  const rightPath = await writeEditorArtifactFile(directory, 'right.json', buildExtractEditorArtifact(rightPage));

  return { leftPath, rightPath };
}

function stringifyStableJson(value: unknown): string {
  return `${JSON.stringify(deepSortKeys(value), null, 2)}\n`;
}

function deepSortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => deepSortKeys(entry));
  }

  if (isPlainObject(value)) {
    return Object.keys(value)
      .sort((left, right) => left.localeCompare(right))
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = deepSortKeys(value[key]);
        return result;
      }, {});
  }

  return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
