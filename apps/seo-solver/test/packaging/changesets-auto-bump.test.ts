import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, test } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const changesetBin = join(__dirname, '..', '..', '..', '..', 'node_modules', '.bin', 'changeset');

describe.sequential('changesets dependent bump contract', () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(tempDirs.map(async (dir) => await rm(dir, { recursive: true, force: true })));
  });

  test('bumps the CLI when an internal dependency receives a changeset', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'seo-solver-changesets-'));
    tempDirs.push(tempDir);

    await mkdir(join(tempDir, '.changeset'), { recursive: true });
    await mkdir(join(tempDir, 'apps', 'seo-solver'), { recursive: true });
    await mkdir(join(tempDir, 'packages', 'types'), { recursive: true });

    await writeFile(
      join(tempDir, 'package.json'),
      `${JSON.stringify({ name: 'fixture-root', private: true, packageManager: 'pnpm@10.33.0' }, null, 2)}\n`,
    );
    await writeFile(join(tempDir, 'pnpm-workspace.yaml'), 'packages:\n  - apps/*\n  - packages/*\n');
    await writeFile(
      join(tempDir, '.changeset', 'config.json'),
      `${JSON.stringify(
        {
          $schema: 'https://unpkg.com/@changesets/config@3.1.3/schema.json',
          changelog: false,
          commit: false,
          fixed: [],
          linked: [],
          access: 'public',
          baseBranch: 'main',
          updateInternalDependencies: 'patch',
          bumpVersionsWithWorkspaceProtocolOnly: true,
          ignore: [],
        },
        null,
        2,
      )}\n`,
    );
    await writeFile(
      join(tempDir, '.changeset', 'types-change.md'),
      '---\n"@seo-solver/types": minor\n---\n\nfixture\n',
    );
    await writeFile(
      join(tempDir, 'packages', 'types', 'package.json'),
      `${JSON.stringify({ name: '@seo-solver/types', version: '0.0.0' }, null, 2)}\n`,
    );
    await writeFile(
      join(tempDir, 'apps', 'seo-solver', 'package.json'),
      `${JSON.stringify(
        {
          name: 'seo-solver',
          version: '0.0.3',
          dependencies: {
            '@seo-solver/types': 'workspace:^',
          },
        },
        null,
        2,
      )}\n`,
    );

    execFileSync(changesetBin, ['version'], {
      cwd: tempDir,
      encoding: 'utf8',
      env: process.env,
    });

    const cliPackageJson = JSON.parse(await readFile(join(tempDir, 'apps', 'seo-solver', 'package.json'), 'utf8')) as {
      version: string;
      dependencies: Record<string, string>;
    };
    const typesPackageJson = JSON.parse(await readFile(join(tempDir, 'packages', 'types', 'package.json'), 'utf8')) as {
      version: string;
    };

    expect(typesPackageJson.version).toBe('0.1.0');
    expect(cliPackageJson.version).toBe('0.0.4');
    expect(cliPackageJson.dependencies['@seo-solver/types']).toBe('workspace:^');
  });
});
