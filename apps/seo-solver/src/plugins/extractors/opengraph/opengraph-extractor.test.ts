import { readFixture } from '#test-support';
import { expect, test } from '#test-support/test-runtime';
import { OpenGraphExtractor } from './opengraph-extractor';

test('extracts opengraph and twitter tags from fixture html', async () => {
  const extractor = new OpenGraphExtractor();
  const document = await extractor.extract({
    source: { url: 'https://example.test/og-left', fetcherId: 'basic' },
    finalUrl: 'https://example.test/og-left',
    body: await readFixture('opengraph-left.html'),
    headers: {},
    meta: {},
  });

  expect(document.kind).toBe('opengraph');
  expect(document.summary?.itemCount).toBe(3);
  expect(document.data['og:title']).toBe('Left OG title');
  expect(document.data['twitter:card']).toBe('summary');
});
