import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '#test-support/test-runtime';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const ENFORCED_DIRECTORIES = ['app', 'bootstrap', 'kernel', 'plugins'] as const;
const FORBIDDEN_PATTERNS = [/console\.(log|error|warn|info)/, /process\.exit/, /stdout\.write/, /stderr\.write/];

test('non-cli layers do not print or terminate directly', async () => {
  const violations: string[] = [];

  for (const directory of ENFORCED_DIRECTORIES) {
    const files = await collectTypeScriptFiles(join(ROOT, directory));

    for (const file of files) {
      if (file.endsWith('.test.ts')) {
        continue;
      }

      const content = await readFile(file, 'utf8');
      const matches = FORBIDDEN_PATTERNS.filter((pattern) => pattern.test(content));

      if (matches.length > 0) {
        violations.push(file.replace(`${ROOT}/`, ''));
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
