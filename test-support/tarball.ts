import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { isAbsolute, join } from 'node:path';

export async function inspectPackedPackage(packageDir: string) {
  const tempDir = await mkdtemp(join(tmpdir(), 'seo-solver-pack-'));

  try {
    execFileSync('pnpm', ['run', 'build'], {
      cwd: packageDir,
      encoding: 'utf8',
    });

    const packedOutput = execFileSync('npm', ['pack', '--ignore-scripts', '--pack-destination', tempDir], {
      cwd: packageDir,
      encoding: 'utf8',
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
