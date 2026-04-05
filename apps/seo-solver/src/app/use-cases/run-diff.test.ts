import { createRunDiff } from '#app';
import { createCapabilityRegistry, type ExtractorBundle } from '#kernel';
import { FakeComparator, FakeExtractor, FakeFetcher, FakeRenderer } from '#test-support';
import { expect, test } from '#test-support/test-runtime';

test('runDiff orchestrates fetch, extract, compare, and render through the registry', async () => {
  const registry = createCapabilityRegistry();
  const fetcher = new FakeFetcher({ 'https://left.test': 'left', 'https://right.test': 'right' }, 'basic');
  const extractor = new FakeExtractor('jsonld', 'jsonld');
  const bundle: ExtractorBundle = {
    id: 'jsonld',
    extractor,
    comparator: new FakeComparator(),
    validators: [],
  };
  const renderer = new FakeRenderer();

  registry.fetchers.set(fetcher.id, fetcher);
  registry.extractors.set(bundle.id, bundle);
  registry.renderers.set(renderer.id, renderer);

  const runDiff = createRunDiff(registry);
  const result = await runDiff({
    leftUrl: 'https://left.test',
    rightUrl: 'https://right.test',
    fetcherId: 'basic',
    extractorId: 'jsonld',
    rendererId: 'fake-renderer',
  });

  expect(result.kind).toBe('text');
  if (result.kind === 'text') {
    expect(result.content).toContain('"mode":"diff"');
    expect(result.content).toContain('"extractorId":"jsonld"');
  }
});
