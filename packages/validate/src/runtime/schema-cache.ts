import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export async function loadSchemaWithCache(config: {
  cacheFile: string | null;
  refreshTtlMs: number;
  schemaUrl: string;
}): Promise<unknown | null> {
  const cached = await readCachedSchema(config.cacheFile, config.refreshTtlMs);
  if (cached.fresh) {
    return cached.value;
  }

  try {
    const response = await fetch(config.schemaUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch schema.org schema: ${response.status}`);
    }

    const json = await response.json();
    if (config.cacheFile) {
      await mkdir(dirname(config.cacheFile), { recursive: true });
      await writeFile(config.cacheFile, JSON.stringify(json), 'utf8');
    }
    return json;
  } catch {
    return cached.value;
  }
}

async function readCachedSchema(
  cacheFile: string | null,
  refreshTtlMs: number,
): Promise<{ value: unknown | null; fresh: boolean }> {
  if (!cacheFile) {
    return { value: null, fresh: false };
  }

  try {
    const [contents, details] = await Promise.all([readFile(cacheFile, 'utf8'), stat(cacheFile)]);
    return {
      value: JSON.parse(contents) as unknown,
      fresh: Date.now() - details.mtimeMs < refreshTtlMs,
    };
  } catch {
    return { value: null, fresh: false };
  }
}
