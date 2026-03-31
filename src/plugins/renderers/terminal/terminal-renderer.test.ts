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
