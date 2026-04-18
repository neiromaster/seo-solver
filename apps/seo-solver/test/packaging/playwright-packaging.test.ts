import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { simulateCliPublishInstall } from '../../../../test-support/tarball.js';

describe('playwright optional packaging', () => {
  test('packs and installs the CLI with optional playwright peer metadata and no hard dependency', async () => {
    const packed = await simulateCliPublishInstall(join(import.meta.dirname, '..', '..'));

    const packagedRuntimeJs = packed.files.filter(
      (file) => file.startsWith('package/dist/') && file.endsWith('.js') && !file.endsWith('.js.map'),
    );

    expect(packagedRuntimeJs).toEqual(['package/dist/index.js']);
    expect(packed.files).toContain('package/dist/index.js');
    expect(packed.packedPackageJson.dependencies).toBeUndefined();
    expect(packed.packedPackageJson.peerDependencies?.['@seo-solver/fetch-playwright']).toBeDefined();
    expect(packed.packedPackageJson.peerDependenciesMeta?.['@seo-solver/fetch-playwright']?.optional).toBe(true);
    expect(packed.installedPackageJson.dependencies).toBeUndefined();
    expect(packed.installedSeoSolverScopedPackages).toEqual([]);
    expect(JSON.parse(packed.installedCliOutput)).toBeInstanceOf(Array);
    expect(await readFile(join(import.meta.dirname, '..', '..', 'package.json'), 'utf8')).toBe(
      packed.originalPackageJson,
    );
    expect(packed.backupFileLeftBehind).toBe(false);

    expect(packed.installedPackageJson.peerDependencies?.['@seo-solver/fetch-playwright']).toBeDefined();
    expect(packed.files).toContain('package/dist/index.js');
  }, 120000);

  test('supports the optional playwright fetcher from the installed tarball when the peer is added', async () => {
    const html =
      '<!doctype html><html><head><title>Healthy Title Example</title><meta name="description" content="This is a sufficiently long meta description for the clean page example."><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><h1>Primary heading</h1></body></html>';
    const url = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;

    const packed = await simulateCliPublishInstall(join(import.meta.dirname, '..', '..'), {
      additionalPackageDirs: [
        join(import.meta.dirname, '..', '..', '..', '..', 'packages', 'types'),
        join(import.meta.dirname, '..', '..', '..', '..', 'packages', 'fetch'),
        join(import.meta.dirname, '..', '..', '..', '..', 'packages', 'fetch-playwright'),
      ],
      additionalInstallPackages: ['playwright'],
      postInstallCommand: [
        'node_modules/seo-solver/dist/index.js',
        'validate',
        url,
        '--fetcher',
        'playwright',
        '--format',
        'json',
      ],
    });

    expect(packed.postInstallResult?.error).toBeUndefined();
    expect([0, 1, 2]).toContain(packed.postInstallResult?.status ?? -1);
    expect(packed.postInstallResult?.stderr).not.toContain('Playwright fetcher requires package');
    expect(packed.postInstallResult?.stderr).not.toContain('ERR_MODULE_NOT_FOUND');
  }, 180000);
});
