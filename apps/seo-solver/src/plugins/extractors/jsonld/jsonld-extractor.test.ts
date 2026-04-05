import { readFixture } from '#test-support';
import { expect, test } from '#test-support/test-runtime';
import { JsonLdExtractor } from './jsonld-extractor';

test('extracts normalized JSON-LD documents from fixture html', async () => {
  const extractor = new JsonLdExtractor();
  const document = await extractor.extract({
    source: { url: 'https://example.com/left', fetcherId: 'basic' },
    finalUrl: 'https://example.com/left',
    body: await readFixture('jsonld-left.html'),
    headers: {},
    meta: {},
  });

  expect(document.kind).toBe('jsonld');
  expect(document.summary?.itemCount).toBe(1);
  expect(Array.isArray(document.data)).toBe(true);
});

test('fails on malformed JSON-LD fixture', async () => {
  const extractor = new JsonLdExtractor();

  await expect(
    extractor.extract({
      source: { url: 'https://example.com/broken', fetcherId: 'basic' },
      finalUrl: 'https://example.com/broken',
      body: await readFixture('jsonld-invalid.html'),
      headers: {},
      meta: {},
    }),
  ).rejects.toThrow('Failed to parse JSON-LD');
});
