import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { writeOutput } from '../../src/cli-support/output';

describe('writeOutput', () => {
  const stderrSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

  afterEach(() => {
    stderrSpy.mockClear();
    stdoutSpy.mockClear();
  });

  test('writes to stdout with trailing newline when no file is provided', async () => {
    await writeOutput('hello', undefined);

    expect(stdoutSpy).toHaveBeenNthCalledWith(1, 'hello');
    expect(stdoutSpy).toHaveBeenNthCalledWith(2, '\n');
  });

  test('writes to a file and logs confirmation on stderr', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'seo-solver-write-'));
    const filePath = join(dir, 'out.txt');

    await writeOutput('hello', filePath);

    expect(await readFile(filePath, 'utf8')).toBe('hello');
    expect(stderrSpy).toHaveBeenCalledWith(`Report written to ${filePath}`);
  });
});
