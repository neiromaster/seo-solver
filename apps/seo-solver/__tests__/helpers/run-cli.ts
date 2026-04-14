import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const packageRoot = fileURLToPath(new URL('../..', import.meta.url));

export type CLIResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
};

export async function runCLI(args: string[], options: { env?: NodeJS.ProcessEnv } = {}): Promise<CLIResult> {
  return await runCommand('pnpm', ['exec', 'tsx', 'src/index.ts', ...args], options.env);
}

export async function buildCLI(options: { env?: NodeJS.ProcessEnv } = {}): Promise<CLIResult> {
  return await runCommand('pnpm', ['build'], options.env);
}

export async function runBuiltCLI(args: string[], options: { env?: NodeJS.ProcessEnv } = {}): Promise<CLIResult> {
  return await runCommand('node', ['dist/index.js', ...args], options.env);
}

async function runCommand(command: string, args: string[], envOverrides: NodeJS.ProcessEnv = {}): Promise<CLIResult> {
  return await new Promise<CLIResult>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: packageRoot,
      env: {
        ...process.env,
        ...envOverrides,
        NO_COLOR: '1',
      },
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
