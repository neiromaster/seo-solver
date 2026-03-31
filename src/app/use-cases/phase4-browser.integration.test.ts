import { expect, mock, test } from 'bun:test';
import { createCapabilityRegistry, type ExtractorBundle } from '#kernel';
import { JsonLdComparator, JsonLdExtractor } from '#plugins/extractors/jsonld';
import { BrowserFetcher } from '#plugins/fetchers/browser-fetcher';
import { TerminalRenderer } from '#plugins/renderers/terminal';
import { createRunInspect } from './run-inspect';

test('browser fetch path plugs into existing inspect use-case without app changes', async () => {
  const registry = createCapabilityRegistry();

  registry.fetchers.set(
    'browser',
    new BrowserFetcher({
      browserHtmlClient: {
        get: mock(async () => ({
          finalUrl: 'https://example.test/rendered',
          html: '<html><head><script type="application/ld+json">{"@type":"Article","headline":"Rendered headline"}</script></head></html>',
        })),
      },
    }),
  );
  registry.extractors.set('jsonld', {
    id: 'jsonld',
    extractor: new JsonLdExtractor(),
    comparator: new JsonLdComparator(),
    validators: [],
  } satisfies ExtractorBundle);
  registry.renderers.set('terminal', new TerminalRenderer());

  const runInspect = createRunInspect(registry);
  const result = await runInspect({
    url: 'https://example.test/start',
    fetcherId: 'browser',
    extractorId: 'jsonld',
    rendererId: 'terminal',
  });

  expect(result.kind).toBe('text');
  if (result.kind === 'text') {
    expect(result.content).toContain('Extracted');
    expect(result.content).toContain('Rendered headline');
  }
});
