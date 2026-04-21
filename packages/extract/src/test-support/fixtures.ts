import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const fixturesDirectory = fileURLToPath(new URL('../__fixtures__/', import.meta.url));

export function readFixture(name: string): string {
  return readFileSync(join(fixturesDirectory, name), 'utf8');
}
