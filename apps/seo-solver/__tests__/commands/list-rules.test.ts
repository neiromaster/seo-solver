import { describe, expect, test } from 'vitest';
import { buildCLI, runBuiltCLI, runCLI } from '../helpers/run-cli.js';

describe('list-rules command', () => {
  test('prints grouped terminal output', async () => {
    const result = await runCLI(['list-rules']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Available rules');
    expect(result.stdout).toContain('jsonld');
  });

  test('prints json output when requested', async () => {
    const result = await runCLI(['list-rules', '--format', 'json']);

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual(expect.any(Array));
  });

  test('rejects unsupported formats clearly', async () => {
    const result = await runCLI(['list-rules', '--format', 'html']);

    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain('Unsupported list-rules format: html');
  }, 10000);

  test('built dist binary runs successfully', async () => {
    const buildResult = await buildCLI();
    expect(buildResult.exitCode).toBe(0);

    const result = await runBuiltCLI(['list-rules', '--format', 'json']);
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual(expect.any(Array));
  }, 20000);
});
