import { readFile } from 'node:fs/promises';

export async function readFixture(name: string): Promise<string> {
  return readFile(new URL(`./${name}`, import.meta.url), 'utf8');
}
