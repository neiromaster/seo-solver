import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { createFakeEditor, readFakeEditorLog } from '../helpers/fake-editor';
import { runCLI } from '../helpers/run-cli';
import { createTestServer, type TestServer } from '../helpers/test-server';

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

  test('opens extraction json in configured editor', async () => {
    const { editorPath, logPath } = await createFakeEditor();
    const result = await runCLI(['extract', `${server.baseUrl}/`, '--editor', 'code'], {
      env: {
        SEO_SOLVER_EDITOR_CODE_BIN: editorPath,
        FAKE_EDITOR_LOG_PATH: logPath,
      },
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('');

    const entries = await readFakeEditorLog(logPath);
    expect(entries).toHaveLength(1);
    const firstEntry = entries[0];
    expect(firstEntry).toBeDefined();
    if (!firstEntry) {
      throw new Error('Expected fake editor invocation');
    }

    expect(firstEntry.args).toHaveLength(1);

    const artifactPath = firstEntry.args[0];
    expect(artifactPath).toBeDefined();
    if (!artifactPath) {
      throw new Error('Expected extraction artifact path');
    }

    const artifact = JSON.parse(await readFile(artifactPath, 'utf8'));
    expect(artifact.source.url).toBe(`${server.baseUrl}/`);
  });

  test('opens explicit output file when editor and output are both provided', async () => {
    const { editorPath, logPath } = await createFakeEditor();
    const directory = await mkdtemp(join(tmpdir(), 'seo-solver-extract-editor-'));
    const outputPath = join(directory, 'extract.json');
    const result = await runCLI(['extract', `${server.baseUrl}/`, '--editor', 'code', '--output', outputPath], {
      env: {
        SEO_SOLVER_EDITOR_CODE_BIN: editorPath,
        FAKE_EDITOR_LOG_PATH: logPath,
      },
    });

    expect(result.exitCode).toBe(0);
    const entries = await readFakeEditorLog(logPath);
    const firstEntry = entries[0];
    expect(firstEntry).toBeDefined();
    if (!firstEntry) {
      throw new Error('Expected fake editor invocation');
    }

    const openedPath = firstEntry.args[0];
    expect(openedPath).toBeDefined();
    expect(openedPath).toBe(outputPath);
    expect(JSON.parse(await readFile(outputPath, 'utf8')).source.url).toBe(`${server.baseUrl}/`);
  });
});
