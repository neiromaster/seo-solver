import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { urlSlug } from '#lib/url-utils';
import type { Schema } from '#types';

export function formatSchemasForDiff(schemas: Schema[]): string {
  const sorted = [...schemas].sort((a, b) => {
    const ta = String(a['@type'] ?? '');
    const tb = String(b['@type'] ?? '');
    return ta < tb ? -1 : ta > tb ? 1 : 0;
  });
  return JSON.stringify(sorted, null, 2);
}

export function openVscodeDiff(
  content1: string,
  content2: string,
  prefix: string,
  label1: string,
  label2: string,
): void {
  const tmp = tmpdir();
  const f1 = join(tmp, `${prefix}_${urlSlug(label1)}.json`);
  const f2 = join(tmp, `${prefix}_${urlSlug(label2)}.json`);
  writeFileSync(f1, content1, 'utf8');
  writeFileSync(f2, content2, 'utf8');
  console.log(`\nSaved:\n  ${f1}\n  ${f2}`);
  try {
    execFileSync('code', ['--diff', f1, f2], { stdio: 'inherit' });
  } catch {
    console.error('Could not open VS Code. Make sure `code` CLI is in PATH.');
  }
}
