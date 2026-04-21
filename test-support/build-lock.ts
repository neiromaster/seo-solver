import { mkdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const lockDir = join(tmpdir(), 'seo-solver-build-lock');
const retryDelayMs = 100;
const staleLockMs = 5 * 60 * 1000;
const maxWaitMs = 10 * 60 * 1000;

export async function withSerializedBuild<T>(action: () => Promise<T>): Promise<T> {
  await acquireBuildLock();

  try {
    return await action();
  } finally {
    await releaseBuildLock();
  }
}

async function acquireBuildLock(): Promise<void> {
  const startedAt = Date.now();

  while (true) {
    try {
      // biome-ignore lint/performance/noAwaitInLoops: lock acquisition is inherently sequential
      await mkdir(lockDir);
      return;
    } catch (error) {
      if (!isAlreadyExistsError(error)) {
        throw error;
      }

      if (await isStaleLock()) {
        await releaseBuildLock();
        continue;
      }

      if (Date.now() - startedAt > maxWaitMs) {
        throw new Error(`Timed out waiting for build lock at ${lockDir}`);
      }

      await sleep(retryDelayMs);
    }
  }
}

async function releaseBuildLock(): Promise<void> {
  await rm(lockDir, { recursive: true, force: true });
}

function isAlreadyExistsError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && error.code === 'EEXIST';
}

async function isStaleLock(): Promise<boolean> {
  try {
    const { mtimeMs } = await stat(lockDir);
    return Date.now() - mtimeMs > staleLockMs;
  } catch {
    return false;
  }
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
