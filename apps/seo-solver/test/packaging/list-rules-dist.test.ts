import { describe, expect, test } from 'vitest';
import { buildCLI, runBuiltCLI } from '../e2e/helpers/run-cli';

describe('list-rules dist packaging', () => {
  test('built dist binary runs successfully', async () => {
    const buildResult = await buildCLI();
    expect(buildResult.exitCode).toBe(0);

    const result = await runBuiltCLI(['list-rules', '--format', 'json']);
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual(expect.any(Array));
  }, 20000);
});
