import { expect, test } from 'bun:test';
import type { SchemaOrgValidationRuntime } from '#adapters/validation';
import { createCapabilityRegistry, type ExtractorBundle } from '#kernel';
import { JsonLdComparator, JsonLdExtractor, SchemaOrgValidator } from '#plugins/extractors/jsonld';
import { BasicFetcher } from '#plugins/fetchers/basic-fetcher';
import { TerminalRenderer } from '#plugins/renderers/terminal';
import { readFixture } from '#test-support';
import { createRunDiff } from './run-diff';
import { createRunValidate } from './run-validate';

test('phase 2 diff happy path works through real V2 capabilities', async () => {
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
  registry.renderers.set('terminal', new TerminalRenderer());

  const runDiff = createRunDiff(registry);
  const result = await runDiff({
    leftUrl: 'https://example.test/left',
    rightUrl: 'https://example.test/right',
    fetcherId: 'basic',
    extractorId: 'jsonld',
    rendererId: 'terminal',
  });

  expect(result.kind).toBe('text');
  if (result.kind === 'text') {
    expect(result.content).toContain('Differences found');
    expect(result.content).toContain('headline');
  }
});

test('phase 2 validate happy path works through real V2 capabilities', async () => {
  const registry = createCapabilityRegistry();
  const runtime: SchemaOrgValidationRuntime = {
    validateJsonLd: async () => [],
  };

  registry.fetchers.set(
    'basic',
    new BasicFetcher({
      get: async (url) => ({
        finalUrl: url,
        statusCode: 200,
        contentType: url.includes('schema.org') ? 'application/ld+json' : 'text/html',
        body: url.includes('schema.org')
          ? JSON.stringify({ '@context': 'https://schema.org' })
          : await readFixture('jsonld-left.html'),
        headers: {},
      }),
    }),
  );
  registry.extractors.set('jsonld', {
    id: 'jsonld',
    extractor: new JsonLdExtractor(),
    comparator: new JsonLdComparator(),
    validators: [new SchemaOrgValidator(runtime)],
  } satisfies ExtractorBundle);
  registry.renderers.set('terminal', new TerminalRenderer());

  const runValidate = createRunValidate(registry);
  const result = await runValidate({
    url: 'https://example.test/left',
    fetcherId: 'basic',
    extractorId: 'jsonld',
    rendererId: 'terminal',
  });

  expect(result.kind).toBe('text');
  if (result.kind === 'text') {
    expect(result.content).toContain('jsonld (1)');
    expect(result.content).toContain('schema-org');
  }
});
