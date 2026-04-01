import { expect, test } from 'bun:test';
import { readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dir, '..');
const ENFORCED_DIRECTORIES = ['app', 'bootstrap', 'kernel', 'plugins', 'adapters'] as const;
const FORBIDDEN_IMPORTS = ['#core/', '#lib/'] as const;

test('production layers do not import legacy core or shared legacy lib aliases', async () => {
  const violations: string[] = [];

  for (const directory of ENFORCED_DIRECTORIES) {
    const files = await collectTypeScriptFiles(join(ROOT, directory));

    for (const file of files) {
      if (file.endsWith('.test.ts')) {
        continue;
      }

      const content = await Bun.file(file).text();

      for (const forbiddenImport of FORBIDDEN_IMPORTS) {
        if (content.includes(forbiddenImport)) {
          violations.push(`${file.replace(`${ROOT}/`, '')} -> ${forbiddenImport}`);
        }
      }
    }
  }

  expect(violations).toEqual([]);
});

async function collectTypeScriptFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectTypeScriptFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}
