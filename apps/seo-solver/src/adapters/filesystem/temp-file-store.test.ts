import { expect, mock, test } from '#test-support/test-runtime';
import { createTempFileStore } from './temp-file-store';

test('temp file store writes a single file into a generated temp directory', async () => {
  const writeTextFile = mock(async () => undefined);
  const store = createTempFileStore({
    createTempDirectory: async () => '/tmp/seo-solver-test',
    writeTextFile,
  });

  const result = await store.writeFile('one.json', '{"ok":true}');

  expect(result.path).toBe('/tmp/seo-solver-test/one.json');
  expect(writeTextFile).toHaveBeenCalledWith('/tmp/seo-solver-test/one.json', '{"ok":true}');
});

test('temp file store writes multiple files into the same temp directory', async () => {
  const writeTextFile = mock(async () => undefined);
  const store = createTempFileStore({
    createTempDirectory: async () => '/tmp/seo-solver-test',
    writeTextFile,
  });

  const result = await store.writeFiles([
    { fileName: 'left.json', content: 'left' },
    { fileName: 'right.json', content: 'right' },
  ]);

  expect(result.map((file) => file.path)).toEqual([
    '/tmp/seo-solver-test/left.json',
    '/tmp/seo-solver-test/right.json',
  ]);
  expect(writeTextFile).toHaveBeenCalledTimes(2);
});
