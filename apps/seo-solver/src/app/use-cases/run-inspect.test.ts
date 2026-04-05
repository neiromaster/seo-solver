import { createRunInspect } from '#app';
import { createCapabilityRegistry, type ExtractorBundle } from '#kernel';
import { FakeExtractor, FakeFetcher, FakeRenderer } from '#test-support';
import { expect, test } from '#test-support/test-runtime';

test('runInspect orchestrates fetch, extract, and render through the registry', async () => {
  const registry = createCapabilityRegistry();
  const fetcher = new FakeFetcher({ 'https://page.test': 'document' }, 'basic');
  const bundle: ExtractorBundle = {
    id: 'jsonld',
    extractor: new FakeExtractor('jsonld', 'jsonld'),
    validators: [],
  };
  const renderer = new FakeRenderer();

  registry.fetchers.set(fetcher.id, fetcher);
  registry.extractors.set(bundle.id, bundle);
  registry.renderers.set(renderer.id, renderer);

  const runInspect = createRunInspect(registry);
  const result = await runInspect({
    url: 'https://page.test',
    fetcherId: 'basic',
    extractorId: 'jsonld',
    rendererId: 'fake-renderer',
  });

  expect(result.kind).toBe('text');
  if (result.kind === 'text') {
    expect(result.content).toContain('"mode":"inspect"');
    expect(result.content).toContain('"document"');
  }
});
