import { execFileSync, spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, isAbsolute, join } from 'node:path';
import { withSerializedBuild } from './build-lock.js';

function createPackEnv(): NodeJS.ProcessEnv {
  return Object.fromEntries(
    Object.entries(process.env).filter(
      ([key]) => !key.startsWith('npm_') && !key.startsWith('PNPM_') && !key.startsWith('pnpm_'),
    ),
  );
}

async function packWorkspacePackage(packageDir: string, packDir: string): Promise<string> {
  const packedOutput = await withSerializedBuild(async () => {
    execFileSync('pnpm', ['run', 'build'], {
      cwd: packageDir,
      encoding: 'utf8',
      env: createPackEnv(),
    });

    return execFileSync('pnpm', ['pack', '--pack-destination', packDir], {
      cwd: packageDir,
      encoding: 'utf8',
      env: createPackEnv(),
    }).trim();
  });

  const tarballName = packedOutput.split('\n').at(-1) ?? packedOutput;
  return isAbsolute(tarballName) ? tarballName : join(packDir, tarballName);
}

export async function inspectPackedPackage(packageDir: string) {
  const tempDir = await mkdtemp(join(tmpdir(), 'seo-solver-pack-'));

  try {
    await withSerializedBuild(async () => {
      execFileSync('pnpm', ['run', 'build'], {
        cwd: packageDir,
        encoding: 'utf8',
        env: createPackEnv(),
      });
    });

    const packedOutput = execFileSync('npm', ['pack', '--ignore-scripts', '--pack-destination', tempDir], {
      cwd: packageDir,
      encoding: 'utf8',
      env: createPackEnv(),
    }).trim();
    const tarballName = packedOutput.split('\n').at(-1) ?? packedOutput;
    const tarballPath = isAbsolute(tarballName) ? tarballName : join(tempDir, tarballName);
    const files = execFileSync('tar', ['-tf', tarballPath], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
    const packageJson = JSON.parse(
      execFileSync('tar', ['-xOf', tarballPath, 'package/package.json'], { encoding: 'utf8' }),
    ) as {
      exports?: Record<string, unknown>;
      dependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
      peerDependenciesMeta?: Record<string, { optional?: boolean }>;
      bin?: Record<string, string>;
    };

    return { tarballPath, files, packageJson };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

const chunkPattern = /-[A-Za-z0-9_-]{6,}\.js$/;

export function getPackagedRuntimeJsFiles(files: string[]): string[] {
  return files.filter((file) => file.startsWith('package/dist/') && file.endsWith('.js')).sort();
}

export function getPackagedPublicRuntimeJsFiles(files: string[]): string[] {
  return getPackagedRuntimeJsFiles(files).filter((file) => !chunkPattern.test(file));
}

export function getPackagedExportedRuntimeJsFiles(packageJson: { exports?: Record<string, unknown> }): string[] {
  if (!packageJson.exports || typeof packageJson.exports !== 'object') {
    return [];
  }

  const runtimeFiles = new Set<string>();

  for (const exportTarget of Object.values(packageJson.exports)) {
    if (!exportTarget || typeof exportTarget !== 'object' || Array.isArray(exportTarget)) {
      continue;
    }

    for (const key of ['import', 'default']) {
      const value = (exportTarget as Record<string, unknown>)[key];
      if (typeof value === 'string' && value.endsWith('.js')) {
        runtimeFiles.add(`package/${value.replace(/^\.\//, '')}`);
      }
    }
  }

  return [...runtimeFiles].sort();
}

export async function simulateCliPublishInstall(
  packageDir: string,
  options: {
    additionalPackageDirs?: string[];
    additionalInstallPaths?: string[];
    additionalNodeModulePaths?: string[];
    additionalInstallPackages?: string[];
    postInstallCommand?: string[];
  } = {},
) {
  const tempDir = await mkdtemp(join(tmpdir(), 'seo-solver-cli-publish-'));
  const stageDir = join(tempDir, 'cli-stage');
  const installDir = join(tempDir, 'install-root');

  try {
    await mkdir(installDir, { recursive: true });
    const originalPackageJson = await readFile(join(packageDir, 'package.json'), 'utf8');

    await withSerializedBuild(async () => {
      execFileSync('pnpm', ['run', 'build'], {
        cwd: packageDir,
        encoding: 'utf8',
        env: createPackEnv(),
      });
    });

    await cp(packageDir, stageDir, { recursive: true });

    execFileSync('node', ['scripts/strip-bundled-deps.mjs'], {
      cwd: stageDir,
      encoding: 'utf8',
      env: createPackEnv(),
    });

    const mutableStagePackageJson = JSON.parse(await readFile(join(stageDir, 'package.json'), 'utf8')) as {
      scripts?: Record<string, string>;
    };
    if (mutableStagePackageJson.scripts) {
      delete mutableStagePackageJson.scripts.build;
      delete mutableStagePackageJson.scripts.prepack;
      delete mutableStagePackageJson.scripts.prepublishOnly;
      delete mutableStagePackageJson.scripts.postpublish;
    }
    await import('node:fs/promises').then(
      async ({ writeFile }) =>
        await writeFile(join(stageDir, 'package.json'), `${JSON.stringify(mutableStagePackageJson, null, 2)}\n`),
    );

    const packedOutput = await withSerializedBuild(async () => {
      try {
        return execFileSync('pnpm', ['pack', '--pack-destination', tempDir], {
          cwd: stageDir,
          encoding: 'utf8',
          env: createPackEnv(),
        }).trim();
      } finally {
        execFileSync('node', ['scripts/restore-package-json.mjs'], {
          cwd: stageDir,
          encoding: 'utf8',
          env: createPackEnv(),
        });
      }
    });

    const tarballName = packedOutput.split('\n').at(-1) ?? packedOutput;
    const tarballPath = isAbsolute(tarballName) ? tarballName : join(tempDir, tarballName);
    const additionalTarballs = await Promise.all(
      (options.additionalPackageDirs ?? []).map(async (dir) => await packWorkspacePackage(dir, tempDir)),
    );
    const files = execFileSync('tar', ['-tf', tarballPath], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
    const packedPackageJson = JSON.parse(
      execFileSync('tar', ['-xOf', tarballPath, 'package/package.json'], { encoding: 'utf8' }),
    ) as {
      dependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
      peerDependenciesMeta?: Record<string, { optional?: boolean }>;
    };

    execFileSync('npm', ['init', '-y'], {
      cwd: installDir,
      encoding: 'utf8',
      env: createPackEnv(),
    });
    execFileSync(
      'npm',
      [
        'install',
        ...additionalTarballs,
        ...(options.additionalInstallPaths ?? []),
        ...(options.additionalInstallPackages ?? []),
        tarballPath,
      ],
      {
        cwd: installDir,
        encoding: 'utf8',
        env: createPackEnv(),
      },
    );
    await Promise.all(
      (options.additionalNodeModulePaths ?? []).map(async (modulePath) => {
        await cp(modulePath, join(installDir, 'node_modules', basename(modulePath)), { recursive: true });
      }),
    );

    const installedPackageJson = JSON.parse(
      await readFile(join(installDir, 'node_modules', 'seo-solver', 'package.json'), 'utf8'),
    ) as {
      dependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
      peerDependenciesMeta?: Record<string, { optional?: boolean }>;
    };
    const installedNodeModules = await readdir(join(installDir, 'node_modules'));
    const installedSeoSolverScopedPackages = installedNodeModules.includes('@seo-solver')
      ? await readdir(join(installDir, 'node_modules', '@seo-solver'))
      : [];

    const installedCliOutput = execFileSync(
      'node',
      ['node_modules/seo-solver/dist/index.js', 'list-rules', '--format', 'json'],
      {
        cwd: installDir,
        encoding: 'utf8',
        env: createPackEnv(),
      },
    );
    const postInstallResult =
      options.postInstallCommand === undefined
        ? undefined
        : spawnSync('node', options.postInstallCommand, {
            cwd: installDir,
            encoding: 'utf8',
            env: createPackEnv(),
          });
    const restoredStagePackageJson = await readFile(join(stageDir, 'package.json'), 'utf8');
    const packageEntries = await readdir(stageDir);
    const livePackageJsonAfter = await readFile(join(packageDir, 'package.json'), 'utf8');

    return {
      tarballPath,
      files,
      packedPackageJson,
      originalPackageJson,
      restoredStagePackageJson,
      livePackageJsonAfter,
      backupFileLeftBehind: packageEntries.includes('package.json.bak'),
      installedPackageJson,
      installedSeoSolverScopedPackages,
      installedCliOutput,
      postInstallResult,
      installDir,
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
