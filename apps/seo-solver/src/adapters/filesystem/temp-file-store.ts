import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export type TempFile = {
  path: string;
};

export type TempFileStore = {
  writeFile(fileName: string, content: string): Promise<TempFile>;
  writeFiles(files: Array<{ fileName: string; content: string }>): Promise<TempFile[]>;
};

export type TempFileStoreDeps = {
  createTempDirectory: () => Promise<string>;
  writeTextFile: (path: string, content: string) => Promise<void>;
};

export function createTempFileStore(
  deps: TempFileStoreDeps = {
    createTempDirectory: () => mkdtemp(join(tmpdir(), 'seo-solver-')),
    writeTextFile: (path, content) => writeFile(path, content, 'utf8'),
  },
): TempFileStore {
  return {
    async writeFile(fileName, content) {
      const directory = await deps.createTempDirectory();
      const path = join(directory, fileName);
      await deps.writeTextFile(path, content);
      return { path };
    },
    async writeFiles(files) {
      const directory = await deps.createTempDirectory();
      const results: TempFile[] = [];

      for (const file of files) {
        const path = join(directory, file.fileName);
        await deps.writeTextFile(path, file.content);
        results.push({ path });
      }

      return results;
    },
  };
}
