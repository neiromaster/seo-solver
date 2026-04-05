import type { Comparator, DiffResult, ExtractedDocument } from '#kernel';

export class FakeComparator implements Comparator {
  readonly id = 'fake-comparator';

  async compare(left: ExtractedDocument, right: ExtractedDocument): Promise<DiffResult> {
    const equal = JSON.stringify(left.data) === JSON.stringify(right.data);

    return {
      comparatorId: this.id,
      documentKind: left.kind,
      equal,
      changes: equal
        ? []
        : [
            {
              kind: 'changed',
              path: '$',
              left: JSON.stringify(left.data),
              right: JSON.stringify(right.data),
            },
          ],
    };
  }
}
