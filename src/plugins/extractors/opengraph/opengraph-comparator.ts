import type { Comparator, DiffChange, DiffResult, ExtractedDocument } from '#kernel';
import type { OpenGraphDocument, OpenGraphValue } from './opengraph-extractor';

export class OpenGraphComparator implements Comparator {
  readonly id = 'opengraph-comparator';

  async compare(left: ExtractedDocument, right: ExtractedDocument): Promise<DiffResult> {
    const leftDocument = left.data as OpenGraphDocument;
    const rightDocument = right.data as OpenGraphDocument;
    const keys = new Set([...Object.keys(leftDocument), ...Object.keys(rightDocument)]);
    const changes: DiffChange[] = [];

    for (const key of keys) {
      const leftValue = leftDocument[key];
      const rightValue = rightDocument[key];

      if (leftValue === undefined && rightValue !== undefined) {
        changes.push({ kind: 'added', path: key, right: normalizeValue(rightValue) });
        continue;
      }

      if (leftValue !== undefined && rightValue === undefined) {
        changes.push({ kind: 'removed', path: key, left: normalizeValue(leftValue) });
        continue;
      }

      if (normalizeValue(leftValue) !== normalizeValue(rightValue)) {
        changes.push({
          kind: 'changed',
          path: key,
          left: normalizeValue(leftValue),
          right: normalizeValue(rightValue),
        });
      }
    }

    return {
      comparatorId: this.id,
      documentKind: left.kind,
      equal: changes.length === 0,
      changes,
    };
  }
}

function normalizeValue(value: OpenGraphValue | undefined): string {
  if (value === undefined) {
    return '';
  }

  return Array.isArray(value) ? value.join(', ') : value;
}
