import { createCapabilityRegistry, type ExtractorBundle } from '#kernel';
import { JsonLdComparator, JsonLdExtractor } from '#plugins/extractors/jsonld';
import { BasicFetcher } from '#plugins/fetchers/basic-fetcher';
import { EditorDiffRenderer } from '#plugins/renderers/editor-diff';
import { readFixture } from '#test-support';
import { expect, test } from '#test-support/test-runtime';
import { createRunDiff } from './run-diff';
import { createRunInspect } from './run-inspect';

test('editor diff renderer works through diff use-case and returns delegated file bundle', async () => {
  const registry = createCapabilityRegistry();
  const fixtureBodies = {
    'https://example.test/left': await readFixture('jsonld-left.html'),
    'https://example.test/right': await readFixture('jsonld-right.html'),
  };

  registry.fetchers.set(
    'basic',
    new BasicFetcher({
      get: async (url) => ({
        finalUrl: url,
        statusCode: 200,
        contentType: 'text/html',
        body: fixtureBodies[url as keyof typeof fixtureBodies],
        headers: { 'content-type': 'text/html' },
      }),
    }),
  );
  registry.extractors.set('jsonld', {
    id: 'jsonld',
    extractor: new JsonLdExtractor(),
    comparator: new JsonLdComparator(),
    validators: [],
  } satisfies ExtractorBundle);
  registry.renderers.set(
    'editor-diff',
    new EditorDiffRenderer({
      writeFile: async () => ({ path: '/tmp/unused.json' }),
      writeFiles: async () => [{ path: '/tmp/left.json' }, { path: '/tmp/right.json' }],
    }),
  );

  const runDiff = createRunDiff(registry);
  const result = await runDiff({
    leftUrl: 'https://example.test/left',
    rightUrl: 'https://example.test/right',
    fetcherId: 'basic',
    extractorId: 'jsonld',
    rendererId: 'editor-diff',
  });

  expect(result.kind).toBe('files');
  if (result.kind === 'files') {
    expect(result.viewerHint).toBe('diff');
    expect(result.paths).toEqual(['/tmp/left.json', '/tmp/right.json']);
  }
});

test('editor diff renderer works through inspect use-case and returns delegated single-file artifact', async () => {
  const registry = createCapabilityRegistry();

  registry.fetchers.set(
    'basic',
    new BasicFetcher({
      get: async (url) => ({
        finalUrl: url,
        statusCode: 200,
        contentType: 'text/html',
        body: await readFixture('jsonld-left.html'),
        headers: { 'content-type': 'text/html' },
      }),
    }),
  );
  registry.extractors.set('jsonld', {
    id: 'jsonld',
    extractor: new JsonLdExtractor(),
    comparator: new JsonLdComparator(),
    validators: [],
  } satisfies ExtractorBundle);
  registry.renderers.set(
    'editor-diff',
    new EditorDiffRenderer({
      writeFile: async () => ({ path: '/tmp/inspect.json' }),
      writeFiles: async () => [{ path: '/tmp/inspect.json' }],
    }),
  );

  const runInspect = createRunInspect(registry);
  const result = await runInspect({
    url: 'https://example.test/left',
    fetcherId: 'basic',
    extractorId: 'jsonld',
    rendererId: 'editor-diff',
  });

  expect(result.kind).toBe('file');
  if (result.kind === 'file') {
    expect(result.path).toBe('/tmp/inspect.json');
  }
});
