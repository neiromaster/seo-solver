import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { getPackagedExportedRuntimeJsFiles, inspectPackedPackage } from '../../../../test-support/tarball.js';

describe.sequential('fetch packaging contract', () => {
  test('publishes root and advanced exports in the packed tarball', async () => {
    const packed = await inspectPackedPackage(join(import.meta.dirname, '..', '..'));
    expect(packed.packageJson.exports).toHaveProperty('.');
    expect(packed.packageJson.exports).toHaveProperty('./advanced');
    expect(getPackagedExportedRuntimeJsFiles(packed.packageJson)).toEqual([
      'package/dist/advanced.js',
      'package/dist/index.js',
    ]);

    const builtAdvancedEntrypoint = await readFile(
      join(import.meta.dirname, '..', '..', 'dist', 'advanced.js'),
      'utf8',
    );
    expect(builtAdvancedEntrypoint).toContain('registerNativeBackend');
  }, 120000);
});
