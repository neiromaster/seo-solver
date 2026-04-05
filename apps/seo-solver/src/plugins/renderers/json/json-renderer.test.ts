import type { RenderPayload } from '#kernel';
import { expect, test } from '#test-support/test-runtime';
import { JsonRenderer } from './json-renderer';

test('renders inspect payload as machine-readable json', async () => {
  const renderer = new JsonRenderer();
  const payload: RenderPayload = {
    mode: 'inspect',
    extractorId: 'jsonld',
    document: {
      extractorId: 'jsonld',
      kind: 'jsonld',
      source: { url: 'https://example.test', fetcherId: 'basic' },
      data: [{ '@type': 'Article', headline: 'Hello' }],
    },
  };

  const result = await renderer.render(payload);

  expect(result.kind).toBe('text');
  if (result.kind === 'text') {
    const parsed = JSON.parse(result.content) as { mode: 'inspect'; document: { kind: string } };
    expect(parsed.mode).toBe('inspect');
    expect(parsed.document.kind).toBe('jsonld');
  }
});

test('renders diff payload as machine-readable json', async () => {
  const renderer = new JsonRenderer();
  const payload: RenderPayload = {
    mode: 'diff',
    extractorId: 'opengraph',
    leftDocument: {
      extractorId: 'opengraph',
      kind: 'opengraph',
      source: { url: 'https://left.test', fetcherId: 'basic' },
      data: { 'og:title': 'Left' },
    },
    rightDocument: {
      extractorId: 'opengraph',
      kind: 'opengraph',
      source: { url: 'https://right.test', fetcherId: 'basic' },
      data: { 'og:title': 'Right' },
    },
    diff: {
      comparatorId: 'opengraph-comparator',
      documentKind: 'opengraph',
      equal: false,
      changes: [{ kind: 'changed', path: 'og:title', left: 'Left', right: 'Right' }],
    },
  };

  const result = await renderer.render(payload);

  expect(result.kind).toBe('text');
  if (result.kind === 'text') {
    const parsed = JSON.parse(result.content) as { mode: 'diff'; diff: { changes: Array<{ path: string }> } };
    expect(parsed.mode).toBe('diff');
    expect(parsed.diff.changes[0]?.path).toBe('og:title');
  }
});

test('returns non-zero exit code for failed validation payloads', async () => {
  const renderer = new JsonRenderer();
  const payload: RenderPayload = {
    mode: 'validate',
    extractorId: 'jsonld',
    document: {
      extractorId: 'jsonld',
      kind: 'jsonld',
      source: { url: 'https://example.test', fetcherId: 'basic' },
      data: [{ '@type': 'Article' }],
    },
    reports: [
      {
        validatorId: 'schema-org',
        documentKind: 'jsonld',
        ok: false,
        issues: [{ severity: 'error', code: 'headline', message: 'Missing headline' }],
      },
    ],
  };

  const result = await renderer.render(payload);

  expect(result.exitCode).toBe(1);
  if (result.kind === 'text') {
    const parsed = JSON.parse(result.content) as { mode: 'validate'; reports: Array<{ ok: boolean }> };
    expect(parsed.mode).toBe('validate');
    expect(parsed.reports[0]?.ok).toBe(false);
  }
});
