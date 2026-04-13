import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { inspectPackedPackage } from '../../../../test-support/tarball';

describe('playwright optional packaging', () => {
  test('packs the CLI with optional playwright peer metadata and no hard dependency', async () => {
    const packed = await inspectPackedPackage(join(import.meta.dirname, '..', '..'));

    expect(packed.packageJson.bin?.['seo-solver']).toBe('dist/index.js');
    expect(packed.files).toContain('package/dist/index.js');
    expect(packed.packageJson.dependencies?.['@seo-solver/fetch-playwright']).toBeUndefined();
    expect(packed.packageJson.peerDependencies?.['@seo-solver/fetch-playwright']).toBeDefined();
    expect(packed.packageJson.peerDependenciesMeta?.['@seo-solver/fetch-playwright']?.optional).toBe(true);
  }, 30000);
});
