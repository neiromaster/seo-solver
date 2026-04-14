import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { inspectPackedPackage } from '../../../../test-support/tarball';

describe('fetch-playwright packaging contract', () => {
  test('publishes the root dist entry in the packed tarball', async () => {
    const packed = await inspectPackedPackage(join(import.meta.dirname, '..', '..'));
    expect(packed.packageJson.exports).toHaveProperty('.');
    expect(packed.files).toContain('package/dist/index.js');
  }, 30000);
});
