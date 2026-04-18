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
  const installDir = join(tempDir, 'install-root');
  const restorePublishState = () => {
    const packageEntries = execFileSync('ls', ['-a', packageDir], { encoding: 'utf8' }).split('\n');
    if (packageEntries.includes('package.json.bak')) {
      execFileSync('pnpm', ['run', 'postpublish'], {
        cwd: packageDir,
        encoding: 'utf8',
        env: createPackEnv(),
      });
    }
  };

  try {
    await mkdir(installDir, { recursive: true });
    const originalPackageJson = await readFile(join(packageDir, 'package.json'), 'utf8');
    restorePublishState();

    const packedOutput = await withSerializedBuild(async () => {
      try {
        execFileSync('pnpm', ['run', 'prepublishOnly'], {
          cwd: packageDir,
          encoding: 'utf8',
          env: createPackEnv(),
        });

        return execFileSync('pnpm', ['pack', '--pack-destination', tempDir], {
          cwd: packageDir,
          encoding: 'utf8',
          env: createPackEnv(),
        }).trim();
      } finally {
        execFileSync('pnpm', ['run', 'postpublish'], {
          cwd: packageDir,
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

    restorePublishState();

    const packageEntries = await readdir(packageDir);

    return {
      tarballPath,
      files,
      packedPackageJson,
      originalPackageJson,
      backupFileLeftBehind: packageEntries.includes('package.json.bak'),
      installedPackageJson,
      installedSeoSolverScopedPackages,
      installedCliOutput,
      postInstallResult,
      installDir,
    };
  } finally {
    restorePublishState();
    await rm(tempDir, { recursive: true, force: true });
  }
}
