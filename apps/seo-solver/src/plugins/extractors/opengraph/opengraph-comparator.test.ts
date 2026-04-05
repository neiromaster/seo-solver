import type { ExtractedDocument } from '#kernel';
import { expect, test } from '#test-support/test-runtime';
import { OpenGraphComparator } from './opengraph-comparator';

test('compares key-value style OpenGraph documents', async () => {
  const comparator = new OpenGraphComparator();
  const left: ExtractedDocument = {
    extractorId: 'opengraph',
    kind: 'opengraph',
    source: { url: 'https://left.test', fetcherId: 'basic' },
    data: { 'og:title': 'Left', 'twitter:card': 'summary' },
  };
  const right: ExtractedDocument = {
    extractorId: 'opengraph',
    kind: 'opengraph',
    source: { url: 'https://right.test', fetcherId: 'basic' },
    data: { 'og:title': 'Right', 'og:image': 'https://example.test/image.png', 'twitter:card': 'summary' },
  };

  const result = await comparator.compare(left, right);

  expect(result.equal).toBe(false);
  expect(result.changes.some((change) => change.path === 'og:title')).toBe(true);
  expect(result.changes.some((change) => change.path === 'og:image')).toBe(true);
});
