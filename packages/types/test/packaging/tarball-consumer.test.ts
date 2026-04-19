import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { getPackagedExportedRuntimeJsFiles, inspectPackedPackage } from '../../../../test-support/tarball.js';

describe.sequential('types packaging contract', () => {
  test('publishes root and typed subpath exports in the packed tarball', async () => {
    const packed = await inspectPackedPackage(join(import.meta.dirname, '..', '..'));
    expect(packed.packageJson.exports).toHaveProperty('.');
    expect(packed.packageJson.exports).toHaveProperty('./fetch');
    expect(packed.packageJson.exports).toHaveProperty('./extract');
    expect(packed.packageJson.exports).toHaveProperty('./extract-advanced');
    expect(packed.packageJson.exports).toHaveProperty('./compare');
    expect(packed.packageJson.exports).toHaveProperty('./compare-advanced');
    expect(packed.packageJson.exports).toHaveProperty('./validate');
    expect(packed.packageJson.exports).toHaveProperty('./validate-advanced');
    expect(packed.packageJson.exports).toHaveProperty('./report');
    expect(getPackagedExportedRuntimeJsFiles(packed.packageJson)).toEqual([
      'package/dist/compare-advanced.js',
      'package/dist/compare.js',
      'package/dist/extract-advanced.js',
      'package/dist/extract.js',
      'package/dist/fetch.js',
      'package/dist/index.js',
      'package/dist/report.js',
      'package/dist/validate-advanced.js',
      'package/dist/validate.js',
    ]);
  }, 120000);
});
