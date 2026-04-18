import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { withSerializedBuild } from '../../../../../test-support/build-lock.js';

const packageRoot = fileURLToPath(new URL('../../..', import.meta.url));

export type CLIResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
};

export async function runCLI(args: string[], options: { env?: NodeJS.ProcessEnv } = {}): Promise<CLIResult> {
  return await runCommand(
    'pnpm',
    ['exec', 'tsx', '--conditions=@seo-solver/source', 'src/index.ts', ...args],
    options.env,
  );
}

export async function buildCLI(options: { env?: NodeJS.ProcessEnv } = {}): Promise<CLIResult> {
  return await withSerializedBuild(async () => await runCommand('pnpm', ['run', 'build'], options.env));
}

export async function runBuiltCLI(args: string[], options: { env?: NodeJS.ProcessEnv } = {}): Promise<CLIResult> {
  return await runCommand('node', ['dist/index.js', ...args], options.env);
}

function createCommandEnv(envOverrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    ...Object.fromEntries(
      Object.entries(process.env).filter(
        ([key]) => !key.startsWith('npm_') && !key.startsWith('PNPM_') && !key.startsWith('pnpm_'),
      ),
    ),
    ...envOverrides,
    NO_COLOR: '1',
  };
}

async function runCommand(command: string, args: string[], envOverrides: NodeJS.ProcessEnv = {}): Promise<CLIResult> {
  return await new Promise<CLIResult>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: packageRoot,
      env: createCommandEnv(envOverrides),
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('close', (code) => {
      resolve({
        stdout,
        stderr,
        exitCode: code ?? 0,
      });
    });
  });
}
