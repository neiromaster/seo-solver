import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { getPackagedExportedRuntimeJsFiles, inspectPackedPackage } from '../../../../test-support/tarball.js';

describe.sequential('compare packaging contract', () => {
  test('publishes generic root and advanced exports in the packed tarball', async () => {
    const packed = await inspectPackedPackage(join(import.meta.dirname, '..', '..'));

    expect(packed.packageJson.exports).toHaveProperty('.');
    expect(packed.packageJson.exports).toHaveProperty('./advanced');
    expect((packed.packageJson as { sideEffects?: boolean }).sideEffects).toBe(false);
    expect(getPackagedExportedRuntimeJsFiles(packed.packageJson)).toEqual([
      'package/dist/advanced.js',
      'package/dist/index.js',
    ]);

    const rootEntrypoint = packed.files.find((file) => file === 'package/dist/index.js');
    expect(rootEntrypoint).toBeDefined();

    const builtRootEntrypoint = await readFile(join(import.meta.dirname, '..', '..', 'dist', 'index.js'), 'utf8');
    expect(builtRootEntrypoint).not.toContain('pipeline');
    expect(builtRootEntrypoint).not.toContain('seo/');
  }, 120000);
});
