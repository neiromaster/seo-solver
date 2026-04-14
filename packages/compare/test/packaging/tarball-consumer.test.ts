import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { inspectPackedPackage } from '../../../../test-support/tarball';

describe('compare packaging contract', () => {
  test('publishes root and advanced exports in the packed tarball', async () => {
    const packed = await inspectPackedPackage(join(import.meta.dirname, '..', '..'));
    expect(packed.packageJson.exports).toHaveProperty('.');
    expect(packed.packageJson.exports).toHaveProperty('./advanced');
    expect(packed.files).toContain('package/dist/index.js');
    expect(packed.files).toContain('package/dist/advanced.js');
  }, 30000);
});
