import { expect, test } from 'bun:test';
import { createRunValidate } from '#app';
import { createCapabilityRegistry, type ExtractorBundle } from '#kernel';
import { FakeExtractor, FakeFetcher, FakeRenderer, FakeValidator } from '#test-support';

test('runValidate orchestrates fetch, extract, validate, and render through the registry', async () => {
  const registry = createCapabilityRegistry();
  const fetcher = new FakeFetcher({ 'https://page.test': 'document' }, 'basic');
  const bundle: ExtractorBundle = {
    id: 'jsonld',
    extractor: new FakeExtractor('jsonld', 'jsonld'),
    validators: [new FakeValidator()],
  };
  const renderer = new FakeRenderer();

  registry.fetchers.set(fetcher.id, fetcher);
  registry.extractors.set(bundle.id, bundle);
  registry.renderers.set(renderer.id, renderer);

  const runValidate = createRunValidate(registry);
  const result = await runValidate({
    url: 'https://page.test',
    fetcherId: 'basic',
    extractorId: 'jsonld',
    rendererId: 'fake-renderer',
  });

  expect(result.kind).toBe('text');
  if (result.kind === 'text') {
    expect(result.content).toContain('"mode":"validate"');
    expect(result.content).toContain('"reports"');
  }
});
