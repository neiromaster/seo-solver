import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { runCLI } from '../helpers/run-cli.js';
import { createTestServer, type TestServer } from '../helpers/test-server.js';

describe('extract command', () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  test('prints extraction json by default', async () => {
    const result = await runCLI(['extract', `${server.baseUrl}/`]);

    expect(result.exitCode).toBe(0);

    const payload = JSON.parse(result.stdout);
    expect(payload.source.url).toBe(`${server.baseUrl}/`);
    expect(payload.source.statusCode).toBe(200);
    expect(payload.data).toEqual(expect.any(Object));
  });

  test('writes output to a file and keeps stdout empty', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'seo-solver-extract-'));
    const outputPath = join(dir, 'extract.json');
    const result = await runCLI(['extract', `${server.baseUrl}/`, '--output', outputPath]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain(`Report written to ${outputPath}`);
    expect(JSON.parse(await readFile(outputPath, 'utf8'))).toEqual(
      expect.objectContaining({ source: expect.objectContaining({ url: `${server.baseUrl}/` }) }),
    );
  });

  test('rejects unsupported extract formats clearly', async () => {
    const result = await runCLI(['extract', `${server.baseUrl}/`, '--format', 'html']);

    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain('Unsupported extract format: html');
  }, 10000);

  test('supports selective extractors', async () => {
    const result = await runCLI(['extract', `${server.baseUrl}/`, '--targets', 'headings']);

    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.data.headings).toEqual(expect.any(Array));
    expect(payload.data.meta).toBeNull();
    expect(payload.data.opengraph).toBeNull();
  }, 10000);
});
