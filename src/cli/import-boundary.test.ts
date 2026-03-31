import { expect, test } from 'bun:test';
import { readdir } from 'node:fs/promises';
import { dirname, join, normalize, relative, resolve } from 'node:path';

const ROOT = '/Users/gavro/projects/seo-solver/src';

const RULES: Record<string, string[]> = {
  kernel: ['kernel'],
  app: ['app', 'kernel'],
  plugins: ['plugins', 'kernel', 'adapters'],
  adapters: ['adapters', 'kernel'],
  bootstrap: ['bootstrap', 'app', 'kernel', 'plugins', 'adapters'],
};

test('v2 production layers respect import boundaries', async () => {
  const violations: string[] = [];

  for (const [layer, allowedTargets] of Object.entries(RULES)) {
    const files = await collectTypeScriptFiles(join(ROOT, layer));

    for (const file of files) {
      if (file.endsWith('.test.ts')) {
        continue;
      }

      const content = await Bun.file(file).text();
      const imports = extractImports(content);

      for (const specifier of imports) {
        const targetLayer = resolveLayer(file, specifier);
        if (!targetLayer) {
          continue;
        }

        if (!allowedTargets.includes(targetLayer)) {
          violations.push(`${relative(ROOT, file)} -> ${specifier} (${targetLayer})`);
        }
      }
    }
  }

  expect(violations).toEqual([]);
});

function extractImports(content: string): string[] {
  const matches = content.matchAll(/from\s+['"]([^'"]+)['"]/g);
  return [...matches].flatMap((match) => (match[1] ? [match[1]] : []));
}

function resolveLayer(importingFile: string, specifier: string): string | null {
  if (specifier.startsWith('#')) {
    const alias = specifier.slice(1).split('/')[0] ?? '';
    return isKnownLayer(alias) ? alias : null;
  }

  if (!specifier.startsWith('.')) {
    return null;
  }

  const resolvedPath = normalize(resolve(dirname(importingFile), specifier));
  const relativePath = relative(ROOT, resolvedPath);
  const layer = relativePath.split('/')[0] ?? '';
  return isKnownLayer(layer) ? layer : null;
}

function isKnownLayer(value: string): boolean {
  return value in RULES;
}

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
