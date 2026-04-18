import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { inspectPackedPackage } from '../../../../test-support/tarball.js';

describe('types packaging contract', () => {
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
    expect(packed.files).toContain('package/dist/index.js');
    expect(packed.files).toContain('package/dist/fetch.js');
    expect(packed.files).toContain('package/dist/extract-advanced.js');
    expect(packed.files).toContain('package/dist/compare-advanced.js');
    expect(packed.files).toContain('package/dist/validate-advanced.js');
  }, 120000);
});
