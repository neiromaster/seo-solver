import { expect, test } from 'bun:test';
import { readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dir, '..');
const ENFORCED_DIRECTORIES = ['app', 'bootstrap', 'kernel', 'plugins', 'adapters'] as const;

const RULES = [
  {
    pattern: /from 'playwright'|from "playwright"/,
    allowedPrefixes: ['adapters/browser/'],
    message: 'Playwright imports must stay in adapters/browser',
  },
  {
    pattern:
      /from '@adobe\/structured-data-validator'|from "@adobe\/structured-data-validator"|import\('@adobe\/structured-data-validator'\)/,
    allowedPrefixes: ['adapters/validation/', 'types/'],
    message: 'Adobe validator usage must stay in adapters/validation or ambient types',
  },
  {
    pattern: /from 'node:child_process'|from "node:child_process"/,
    allowedPrefixes: ['adapters/'],
    message: 'child_process usage must stay in adapters',
  },
  {
    pattern: /from 'node:fs\/promises'|from "node:fs\/promises"/,
    allowedPrefixes: ['adapters/filesystem/'],
    message: 'filesystem temp-file primitives must stay in adapters/filesystem',
  },
] as const;

test('external runtimes stay owned by the intended adapters', async () => {
  const violations: string[] = [];

  for (const directory of ENFORCED_DIRECTORIES) {
    const files = await collectTypeScriptFiles(join(ROOT, directory));

    for (const file of files) {
      if (file.endsWith('.test.ts')) {
        continue;
      }

      const relativePath = file.replace(`${ROOT}/`, '');
      const content = await Bun.file(file).text();

      for (const rule of RULES) {
        if (!rule.pattern.test(content)) {
          continue;
        }

        const isAllowed = rule.allowedPrefixes.some((prefix) => relativePath.startsWith(prefix));
        if (!isAllowed) {
          violations.push(`${relativePath}: ${rule.message}`);
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
