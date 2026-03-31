import { expect, test } from 'bun:test';
import type { RenderPayload } from '#kernel';
import { EditorDiffRenderer } from './editor-diff-renderer';

test('renders diff payload into a delegated diff file bundle', async () => {
  const renderer = new EditorDiffRenderer({
    writeFile: async () => ({ path: '/tmp/unused.json' }),
    writeFiles: async (files) => files.map((file, index) => ({ path: `/tmp/file-${index + 1}.json` })),
  });

  const payload: RenderPayload = {
    mode: 'diff',
    extractorId: 'jsonld',
    leftDocument: {
      extractorId: 'jsonld',
      kind: 'jsonld',
      source: { url: 'https://left.test', fetcherId: 'basic' },
      data: [{ '@type': 'Article', headline: 'Left' }],
    },
    rightDocument: {
      extractorId: 'jsonld',
      kind: 'jsonld',
      source: { url: 'https://right.test', fetcherId: 'basic' },
      data: [{ '@type': 'Article', headline: 'Right' }],
    },
    diff: {
      comparatorId: 'jsonld-comparator',
      documentKind: 'jsonld',
      equal: false,
      changes: [{ kind: 'changed', path: '$.headline', left: 'Left', right: 'Right' }],
    },
  };

  const result = await renderer.render(payload);

  expect(result.kind).toBe('files');
  if (result.kind === 'files') {
    expect(result.viewerHint).toBe('diff');
    expect(result.paths).toEqual(['/tmp/file-1.json', '/tmp/file-2.json']);
  }
});

test('renders inspect payload into a delegated single-file artifact', async () => {
  const renderer = new EditorDiffRenderer({
    writeFile: async () => ({ path: '/tmp/inspect.json' }),
    writeFiles: async (files) =>
      files.map((file, index) => ({ path: index === 0 ? '/tmp/inspect.json' : '/tmp/extra.json' })),
  });

  const payload: RenderPayload = {
    mode: 'inspect',
    extractorId: 'opengraph',
    document: {
      extractorId: 'opengraph',
      kind: 'opengraph',
      source: { url: 'https://example.test', fetcherId: 'basic' },
      data: { 'og:title': 'Hello' },
    },
  };

  const result = await renderer.render(payload);

  expect(result.kind).toBe('file');
  if (result.kind === 'file') {
    expect(result.path).toBe('/tmp/inspect.json');
  }
});

test('rejects validate mode until dedicated editor flow exists', async () => {
  const renderer = new EditorDiffRenderer({
    writeFile: async () => ({ path: '/tmp/unused.json' }),
    writeFiles: async () => [],
  });

  await expect(
    renderer.render({
      mode: 'validate',
      extractorId: 'jsonld',
      document: {
        extractorId: 'jsonld',
        kind: 'jsonld',
        source: { url: 'https://example.test', fetcherId: 'basic' },
        data: [{ '@type': 'Article' }],
      },
      reports: [],
    }),
  ).rejects.toThrow('Editor diff renderer does not support validate mode yet');
});
