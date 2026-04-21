import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { getPackagedExportedRuntimeJsFiles, inspectPackedPackage } from '../../../../test-support/tarball.js';

describe.sequential('fetch-playwright packaging contract', () => {
  test('publishes the root dist entry in the packed tarball', async () => {
    const packed = await inspectPackedPackage(join(import.meta.dirname, '..', '..'));
    expect(packed.packageJson.exports).toHaveProperty('.');
    expect(getPackagedExportedRuntimeJsFiles(packed.packageJson)).toEqual(['package/dist/index.js']);
  }, 120000);
});
