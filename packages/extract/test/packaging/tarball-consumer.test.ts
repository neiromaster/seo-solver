import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { getPackagedExportedRuntimeJsFiles, inspectPackedPackage } from '../../../../test-support/tarball.js';

describe.sequential('extract packaging contract', () => {
  test('publishes root and advanced exports in the packed tarball', async () => {
    const packed = await inspectPackedPackage(join(import.meta.dirname, '..', '..'));
    expect(packed.packageJson.exports).toHaveProperty('.');
    expect(packed.packageJson.exports).toHaveProperty('./advanced');
    expect(getPackagedExportedRuntimeJsFiles(packed.packageJson)).toEqual([
      'package/dist/advanced.js',
      'package/dist/index.js',
    ]);
  }, 120000);
});
