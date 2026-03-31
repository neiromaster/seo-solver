import { expect, test } from 'bun:test';
import { createCapabilityRegistry, type ExtractorBundle } from '#kernel';
import { OpenGraphComparator, OpenGraphExtractor } from '#plugins/extractors/opengraph';
import { BasicFetcher } from '#plugins/fetchers/basic-fetcher';
import { TerminalRenderer } from '#plugins/renderers/terminal';
import { readFixture } from '#test-support';
import { createRunDiff } from './run-diff';
import { createRunInspect } from './run-inspect';

test('phase 3 diff works through the same app flow for opengraph', async () => {
  const registry = createCapabilityRegistry();
  const fixtureBodies = {
    'https://example.test/og-left': await readFixture('opengraph-left.html'),
    'https://example.test/og-right': await readFixture('opengraph-right.html'),
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
  registry.extractors.set('opengraph', {
    id: 'opengraph',
    extractor: new OpenGraphExtractor(),
    comparator: new OpenGraphComparator(),
    validators: [],
  } satisfies ExtractorBundle);
  registry.renderers.set('terminal', new TerminalRenderer());

  const runDiff = createRunDiff(registry);
  const result = await runDiff({
    leftUrl: 'https://example.test/og-left',
    rightUrl: 'https://example.test/og-right',
    fetcherId: 'basic',
    extractorId: 'opengraph',
    rendererId: 'terminal',
  });

  expect(result.kind).toBe('text');
  if (result.kind === 'text') {
    expect(result.content).toContain('Differences found');
    expect(result.content).toContain('og:title');
    expect(result.content).toContain('og:image');
  }
});

test('phase 3 inspect works through the same app flow for opengraph', async () => {
  const registry = createCapabilityRegistry();

  registry.fetchers.set(
    'basic',
    new BasicFetcher({
      get: async (url) => ({
        finalUrl: url,
        statusCode: 200,
        contentType: 'text/html',
        body: await readFixture('opengraph-left.html'),
        headers: { 'content-type': 'text/html' },
      }),
    }),
  );
  registry.extractors.set('opengraph', {
    id: 'opengraph',
    extractor: new OpenGraphExtractor(),
    comparator: new OpenGraphComparator(),
    validators: [],
  } satisfies ExtractorBundle);
  registry.renderers.set('terminal', new TerminalRenderer());

  const runInspect = createRunInspect(registry);
  const result = await runInspect({
    url: 'https://example.test/og-left',
    fetcherId: 'basic',
    extractorId: 'opengraph',
    rendererId: 'terminal',
  });

  expect(result.kind).toBe('text');
  if (result.kind === 'text') {
    expect(result.content).toContain('Extracted');
    expect(result.content).toContain('opengraph');
    expect(result.content).toContain('og:title');
  }
});
