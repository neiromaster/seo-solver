import { mkdtemp, readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { createFakeEditor, readFakeEditorLog } from '../helpers/fake-editor';
import { runCLI } from '../helpers/run-cli';
import { createTestServer, type TestServer } from '../helpers/test-server';

describe('compare command', () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  test('returns exit code 0 for identical pages', async () => {
    const result = await runCLI(['compare', `${server.baseUrl}/`, `${server.baseUrl}/`, '--format', 'json']);

    expect(result.exitCode).toBe(0);

    const payload = JSON.parse(result.stdout);
    expect(payload.urlA).toBe(`${server.baseUrl}/`);
    expect(payload.urlB).toBe(`${server.baseUrl}/`);
    expect(payload.comparisons).toEqual(expect.any(Array));
  });

  test('returns exit code 1 when pages differ', async () => {
    const result = await runCLI(['compare', `${server.baseUrl}/`, `${server.baseUrl}/robots.txt`, '--format', 'json']);

    expect(result.exitCode).toBe(1);

    const payload = JSON.parse(result.stdout);
    expect(payload.comparisons.some((entry: { diffs: unknown[] }) => entry.diffs.length > 0)).toBe(true);
  });

  test('supports selective extractors', async () => {
    const result = await runCLI([
      'compare',
      `${server.baseUrl}/`,
      `${server.baseUrl}/`,
      '--format',
      'json',
      '--targets',
      'meta',
    ]);

    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.comparisons).toHaveLength(1);
    expect(payload.comparisons[0].type).toBe('meta');
  }, 10000);

  test('prints terminal diff output for basic compare', async () => {
    const result = await runCLI(['compare', `${server.baseUrl}/`, `${server.baseUrl}/robots.txt`]);

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain('Comparing:');
    expect(result.stdout).toContain('── Summary ─');
  }, 10000);

  test('reports invalid compare formats as CLI errors', async () => {
    const result = await runCLI(['compare', `${server.baseUrl}/`, `${server.baseUrl}/`, '--format', 'xml']);

    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain('Error: Unsupported format: xml');
  });

  test('fetches both pages in parallel', async () => {
    const parallelServer = await createParallelCompareServer();

    try {
      const result = await runCLI([
        'compare',
        `${parallelServer.baseUrl}/a`,
        `${parallelServer.baseUrl}/b`,
        '--format',
        'json',
      ]);

      expect(result.exitCode).toBe(1);
      expect(parallelServer.getMaxInFlight()).toBeGreaterThanOrEqual(2);
    } finally {
      await parallelServer.close();
    }
  });

  test('opens compare artifacts in editor diff mode while preserving json output', async () => {
    const { editorPath, logPath } = await createFakeEditor();
    const result = await runCLI(
      ['compare', `${server.baseUrl}/`, `${server.baseUrl}/robots.txt`, '--format', 'json', '--editor', 'code'],
      {
        env: {
          SEO_SOLVER_EDITOR_CODE_BIN: editorPath,
          FAKE_EDITOR_LOG_PATH: logPath,
        },
      },
    );

    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.stdout).comparisons).toEqual(expect.any(Array));

    const entries = await readFakeEditorLog(logPath);
    expect(entries).toHaveLength(1);
    const firstEntry = entries[0];
    expect(firstEntry).toBeDefined();
    if (!firstEntry) {
      throw new Error('Expected fake editor invocation');
    }

    expect(firstEntry.args[0]).toBe('--diff');

    const leftPath = firstEntry.args[1];
    const rightPath = firstEntry.args[2];
    expect(leftPath).toBeDefined();
    expect(rightPath).toBeDefined();
    if (!leftPath || !rightPath) {
      throw new Error('Expected compare diff artifact paths');
    }

    const leftArtifact = JSON.parse(await readFile(leftPath, 'utf8'));
    const rightArtifact = JSON.parse(await readFile(rightPath, 'utf8'));
    expect(leftArtifact.source.url).toBe(`${server.baseUrl}/`);
    expect(rightArtifact.source.url).toBe(`${server.baseUrl}/robots.txt`);
  });

  test('keeps output file behavior independent from editor diff mode', async () => {
    const { editorPath, logPath } = await createFakeEditor();
    const outputDirectory = await createOutputDirectory();
    const outputPath = join(outputDirectory, 'compare.json');
    const result = await runCLI(
      [
        'compare',
        `${server.baseUrl}/`,
        `${server.baseUrl}/robots.txt`,
        '--format',
        'json',
        '--output',
        outputPath,
        '--editor',
        'code',
      ],
      {
        env: {
          SEO_SOLVER_EDITOR_CODE_BIN: editorPath,
          FAKE_EDITOR_LOG_PATH: logPath,
        },
      },
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe('');
    expect(JSON.parse(await readFile(outputPath, 'utf8')).comparisons).toEqual(expect.any(Array));

    const entries = await readFakeEditorLog(logPath);
    expect(entries).toHaveLength(1);
    const firstEntry = entries[0];
    expect(firstEntry).toBeDefined();
    if (!firstEntry) {
      throw new Error('Expected fake editor invocation');
    }

    expect(firstEntry.args[0]).toBe('--diff');
  });

  test('opens compare artifacts in cursor diff mode while preserving json output', async () => {
    const { editorPath, logPath } = await createFakeEditor();
    const result = await runCLI(
      ['compare', `${server.baseUrl}/`, `${server.baseUrl}/robots.txt`, '--format', 'json', '--editor', 'cursor'],
      {
        env: {
          SEO_SOLVER_EDITOR_CURSOR_BIN: editorPath,
          FAKE_EDITOR_LOG_PATH: logPath,
        },
      },
    );

    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.stdout).comparisons).toEqual(expect.any(Array));

    const entries = await readFakeEditorLog(logPath);
    expect(entries).toHaveLength(1);
    const firstEntry = entries[0];
    expect(firstEntry).toBeDefined();
    if (!firstEntry) {
      throw new Error('Expected fake editor invocation');
    }

    expect(firstEntry.args[0]).toBe('--diff');
  });
});

async function createOutputDirectory() {
  return await mkdtemp(join(tmpdir(), 'seo-solver-compare-output-'));
}

async function createParallelCompareServer() {
  let inFlight = 0;
  let maxInFlight = 0;

  const server = createServer((request, response) => {
    const path = new URL(request.url ?? '/', 'http://127.0.0.1').pathname;
    const body =
      path === '/a'
        ? '<!doctype html><html><head><title>A title</title><meta name="description" content="Long enough description for page A to avoid validation issues."><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><h1>Heading A</h1></body></html>'
        : '<!doctype html><html><head><title>B title</title><meta name="description" content="Long enough description for page B to avoid validation issues."><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><h1>Heading B</h1></body></html>';

    inFlight += 1;
    maxInFlight = Math.max(maxInFlight, inFlight);

    setTimeout(() => {
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      response.end(body);
      inFlight -= 1;
    }, 200);
  });

  await new Promise<void>((resolve, reject) => {
    server.listen(0, '127.0.0.1', (error?: Error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  const address = server.address() as AddressInfo;

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    getMaxInFlight: () => maxInFlight,
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    },
  };
}
