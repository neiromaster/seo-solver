import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { getPackagedExportedRuntimeJsFiles, inspectPackedPackage } from '../../../../test-support/tarball.js';

describe.sequential('validate packaging contract', () => {
  test('publishes root and advanced exports in the packed tarball', async () => {
    const packed = await inspectPackedPackage(join(import.meta.dirname, '..', '..'));
    expect(packed.packageJson.exports).toHaveProperty('.');
    expect(packed.packageJson.exports).toHaveProperty('./advanced');
    expect(getPackagedExportedRuntimeJsFiles(packed.packageJson)).toEqual([
      'package/dist/advanced.js',
      'package/dist/index.js',
    ]);
  }, 120000);

  test('keeps built-in root page validation separate from advanced page orchestration', async () => {
    await inspectPackedPackage(join(import.meta.dirname, '..', '..'));
    const packageRoot = join(import.meta.dirname, '..', '..');
    const rootEntrypoint = await readFile(join(packageRoot, 'dist/index.js'), 'utf8');
    const advancedEntrypoint = await readFile(join(packageRoot, 'dist/advanced.js'), 'utf8');

    expect(rootEntrypoint).not.toContain('validatePageAdvanced');
    expect(advancedEntrypoint).toContain('validatePageAdvanced');
  }, 120000);
});
