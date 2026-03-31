import { expect, test } from 'bun:test';
import type { SchemaOrgValidationRuntime } from '#adapters/validation';
import { createCapabilityRegistry, type ExtractorBundle } from '#kernel';
import { JsonLdComparator, JsonLdExtractor, SchemaOrgValidator } from '#plugins/extractors/jsonld';
import { BasicFetcher } from '#plugins/fetchers/basic-fetcher';
import { JsonRenderer } from '#plugins/renderers/json';
import { readFixture } from '#test-support';
import { createRunInspect } from './run-inspect';
import { createRunValidate } from './run-validate';

test('json renderer works through inspect use-case', async () => {
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
  registry.renderers.set('json', new JsonRenderer());

  const runInspect = createRunInspect(registry);
  const result = await runInspect({
    url: 'https://example.test/left',
    fetcherId: 'basic',
    extractorId: 'jsonld',
    rendererId: 'json',
  });

  expect(result.kind).toBe('text');
  if (result.kind === 'text') {
    const parsed = JSON.parse(result.content) as { mode: string; document: { kind: string } };
    expect(parsed.mode).toBe('inspect');
    expect(parsed.document.kind).toBe('jsonld');
  }
});

test('json renderer preserves failed validation exit code through use-case', async () => {
  const registry = createCapabilityRegistry();
  const runtime: SchemaOrgValidationRuntime = {
    validateJsonLd: async () => [
      {
        severity: 'ERROR',
        issueMessage: 'Missing headline',
        path: [{ type: 'Article', index: 0 }],
        fieldNames: ['headline'],
      },
    ],
  };

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
    validators: [new SchemaOrgValidator(runtime)],
  } satisfies ExtractorBundle);
  registry.renderers.set('json', new JsonRenderer());

  const runValidate = createRunValidate(registry);
  const result = await runValidate({
    url: 'https://example.test/left',
    fetcherId: 'basic',
    extractorId: 'jsonld',
    rendererId: 'json',
  });

  expect(result.exitCode).toBe(1);
  if (result.kind === 'text') {
    const parsed = JSON.parse(result.content) as { mode: string; reports: Array<{ ok: boolean }> };
    expect(parsed.mode).toBe('validate');
    expect(parsed.reports[0]?.ok).toBe(false);
  }
});
