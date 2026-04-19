import { execFile } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, test } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptDir = join(__dirname, '..', '..', 'scripts');

async function runNode(cwd: string, scriptPath: string) {
  return await new Promise<{ code: number; stdout: string; stderr: string }>((resolve, reject) => {
    const child = execFile('node', [scriptPath], { cwd }, (error, stdout, stderr) => {
      if (error && typeof (error as NodeJS.ErrnoException).code !== 'number') {
        reject(error);
        return;
      }

      resolve({
        code: ((error as NodeJS.ErrnoException | null)?.code as number | undefined) ?? 0,
        stdout,
        stderr,
      });
    });

    child.on('error', reject);
  });
}

describe.sequential('CLI publish hooks', () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(
      tempDirs.map(
        async (dir) => await import('node:fs/promises').then(({ rm }) => rm(dir, { recursive: true, force: true })),
      ),
    );
  });

  test('strip and restore package.json dependencies around publish', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'seo-solver-publish-hooks-'));
    tempDirs.push(tempDir);

    const scriptsPath = join(tempDir, 'scripts');
    await import('node:fs/promises').then(({ mkdir }) => mkdir(scriptsPath, { recursive: true }));
    await writeFile(
      join(scriptsPath, 'strip-bundled-deps.mjs'),
      await readFile(join(scriptDir, 'strip-bundled-deps.mjs'), 'utf8'),
    );
    await writeFile(
      join(scriptsPath, 'restore-package-json.mjs'),
      await readFile(join(scriptDir, 'restore-package-json.mjs'), 'utf8'),
    );

    const originalPackageJson = {
      name: 'seo-solver',
      version: '0.0.3',
      dependencies: {
        '@seo-solver/compare': 'workspace:^',
        'cmd-ts': '^0.15.0',
      },
      peerDependencies: {
        '@seo-solver/fetch-playwright': 'workspace:^',
      },
      peerDependenciesMeta: {
        '@seo-solver/fetch-playwright': {
          optional: true,
        },
      },
    };

    await writeFile(join(tempDir, 'package.json'), `${JSON.stringify(originalPackageJson, null, 2)}\n`);

    const stripResult = await runNode(tempDir, join(scriptsPath, 'strip-bundled-deps.mjs'));
    expect(stripResult.code).toBe(0);

    const strippedPackageJson = JSON.parse(await readFile(join(tempDir, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>;
      peerDependencies: Record<string, string>;
    };

    expect(strippedPackageJson.dependencies).toBeUndefined();
    expect(strippedPackageJson.peerDependencies['@seo-solver/fetch-playwright']).toBe('workspace:^');

    const restoreResult = await runNode(tempDir, join(scriptsPath, 'restore-package-json.mjs'));
    expect(restoreResult.code).toBe(0);

    const restoredPackageJson = JSON.parse(await readFile(join(tempDir, 'package.json'), 'utf8'));
    expect(restoredPackageJson).toEqual(originalPackageJson);
  });

  test('strip script fails loudly when a stale backup already exists', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'seo-solver-publish-hooks-'));
    tempDirs.push(tempDir);

    const scriptsPath = join(tempDir, 'scripts');
    await import('node:fs/promises').then(({ mkdir }) => mkdir(scriptsPath, { recursive: true }));
    await writeFile(
      join(scriptsPath, 'strip-bundled-deps.mjs'),
      await readFile(join(scriptDir, 'strip-bundled-deps.mjs'), 'utf8'),
    );

    await writeFile(join(tempDir, 'package.json'), '{"name":"seo-solver","dependencies":{"cmd-ts":"^0.15.0"}}\n');
    await writeFile(join(tempDir, 'package.json.bak'), '{}\n');

    const result = await runNode(tempDir, join(scriptsPath, 'strip-bundled-deps.mjs'));
    expect(result.code).not.toBe(0);
    expect(result.stderr).toContain('package.json.bak already exists');
  });
});
