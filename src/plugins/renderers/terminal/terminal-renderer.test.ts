import { expect, test } from 'bun:test';
import type { RenderPayload } from '#kernel';
import { TerminalRenderer } from './terminal-renderer';

test('renders diff payload as text', async () => {
  const renderer = new TerminalRenderer();
  const payload: RenderPayload = {
    mode: 'diff',
    extractorId: 'jsonld',
    leftDocument: { extractorId: 'jsonld', kind: 'jsonld', source: { url: 'a', fetcherId: 'basic' }, data: [] },
    rightDocument: { extractorId: 'jsonld', kind: 'jsonld', source: { url: 'b', fetcherId: 'basic' }, data: [] },
    diff: {
      comparatorId: 'jsonld-comparator',
      documentKind: 'jsonld',
      equal: false,
      changes: [{ kind: 'changed', path: '$.headline', left: 'A', right: 'B' }],
    },
  };

  const result = await renderer.render(payload);
  expect(result.kind).toBe('text');
  if (result.kind === 'text') {
    expect(result.content).toContain('Differences found');
    expect(result.content).toContain('$.headline');
  }
});

test('renders validation payload grouped by path with summary counts', async () => {
  const renderer = new TerminalRenderer();
  const payload: RenderPayload = {
    mode: 'validate',
    extractorId: 'jsonld',
    document: {
      extractorId: 'jsonld',
      kind: 'jsonld',
      source: { url: 'https://example.com', fetcherId: 'basic' },
      data: [{ '@type': 'Event' }],
      summary: { itemCount: 1 },
    },
    reports: [
      {
        validatorId: 'schema-org',
        documentKind: 'jsonld',
        ok: false,
        issues: [
          {
            severity: 'warning',
            code: 'highPrice',
            message: 'Missing field "highPrice" (optional)',
            path: 'Event[1].AggregateOffer',
          },
          {
            severity: 'warning',
            code: 'offerCount',
            message: 'Missing field "offerCount" (optional)',
            path: 'Event[1].AggregateOffer',
          },
        ],
      },
    ],
  };

  const result = await renderer.render(payload);
  expect(result.kind).toBe('text');
  if (result.kind === 'text') {
    expect(result.content).toContain('jsonld (1)');
    expect(result.content).toContain('✗ schema-org — 2 warnings');
    expect(result.content).toContain('  Event[1].AggregateOffer');
    expect(result.content).toContain('warning');
    expect(result.content).toContain('highPrice');
    expect(result.content).toContain('offerCount');
    expect(result.content).toContain('Missing field "highPrice" (optional)');
    expect(result.content).toContain('Missing field "offerCount" (optional)');
  }
});

test('renders successful validation payload as no issues', async () => {
  const renderer = new TerminalRenderer();
  const payload: RenderPayload = {
    mode: 'validate',
    extractorId: 'jsonld',
    document: {
      extractorId: 'jsonld',
      kind: 'jsonld',
      source: { url: 'https://example.com', fetcherId: 'basic' },
      data: [{ '@type': 'Article' }],
      summary: { itemCount: 1 },
    },
    reports: [
      {
        validatorId: 'schema-org',
        documentKind: 'jsonld',
        ok: true,
        issues: [],
      },
    ],
  };

  const result = await renderer.render(payload);
  expect(result.kind).toBe('text');
  if (result.kind === 'text') {
    expect(result.content).toContain('✓ schema-org — no issues');
  }
});
