import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { urlSlug } from '#lib/url-utils';
import type { Schema } from '#types';

function saveTempFile(content: string, fileName: string): string {
  const filePath = join(tmpdir(), fileName);
  writeFileSync(filePath, content, 'utf8');
  return filePath;
}

export function ensureEditorAvailable(editor: string): void {
  try {
    execFileSync(editor, ['--version'], { stdio: 'ignore' });
  } catch {
    throw new Error(`Could not find editor \`${editor}\` in PATH.`);
  }
}

function openInEditor(editor: string, args: string[]): void {
  try {
    execFileSync(editor, args, { stdio: 'inherit' });
  } catch {
    console.error(`Could not open editor \`${editor}\`. Make sure it is in PATH.`);
  }
}

export function formatSchemasForDiff(schemas: Schema[]): string {
  const sorted = [...schemas].sort((a, b) => {
    const ta = String(a['@type'] ?? '');
    const tb = String(b['@type'] ?? '');
    return ta < tb ? -1 : ta > tb ? 1 : 0;
  });
  return JSON.stringify(sorted, null, 2);
}

export function openEditorDiff(
  editor: string,
  content1: string,
  content2: string,
  prefix: string,
  label1: string,
  label2: string,
): void {
  const slug1 = urlSlug(label1);
  const slug2 = urlSlug(label2);
  const f1 = saveTempFile(content1, `${prefix}_${slug1}.json`);
  const f2 = saveTempFile(content2, `${prefix}_${slug1 === slug2 ? `${slug2}_2` : slug2}.json`);
  console.log(`\nSaved:\n  ${f1}\n  ${f2}`);
  openInEditor(editor, ['--diff', f1, f2]);
}

export function openEditorFile(
  editor: string,
  content: string,
  prefix: string,
  label: string,
  extension = 'html',
): void {
  const filePath = saveTempFile(content, `${prefix}_${urlSlug(label)}.${extension}`);
  console.log(`\nSaved:\n  ${filePath}`);
  openInEditor(editor, [filePath]);
}
