import { describe, expect, test } from 'vitest';
import { runCLI } from '../helpers/run-cli.js';

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
});
