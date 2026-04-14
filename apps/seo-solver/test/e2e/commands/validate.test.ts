import { mkdtemp, readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { runCLI } from '../helpers/run-cli';

describe('validate command', () => {
  let server: Awaited<ReturnType<typeof createInvalidPageServer>>;

  beforeAll(async () => {
    server = await createInvalidPageServer();
  });

  afterAll(async () => {
    await server.close();
  });

  test('prints validation json and returns exit code 1 when errors are present', async () => {
    const result = await runCLI(['validate', `${server.baseUrl}/`, '--format', 'json']);

    expect(result.exitCode).toBe(1);

    const payload = JSON.parse(result.stdout);
    expect(payload.url).toBe(`${server.baseUrl}/`);
    expect(payload.validations).toEqual(expect.any(Array));
    expect(result.stdout).toContain('headings/missing-h1');
  });

  test('supports the optional playwright fetcher when it is installed', async () => {
    const result = await runCLI(['validate', `${server.baseUrl}/`, '--fetcher', 'playwright', '--format', 'json']);

    expect([0, 1]).toContain(result.exitCode);
    expect(result.stderr).not.toContain('CLIError:');
  }, 10000);

  test('reports invalid URLs as handled fetch errors', async () => {
    const result = await runCLI(['validate', 'not-a-url']);

    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain('Fetch error (INVALID_URL): Invalid URL: not-a-url');
  });

  test('reports invalid format and severity flags as CLI errors', async () => {
    const invalidFormat = await runCLI(['validate', `${server.baseUrl}/`, '--format', 'xml']);
    const invalidSeverity = await runCLI(['validate', `${server.baseUrl}/`, '--min-severity', 'fatal']);

    expect(invalidFormat.exitCode).toBe(2);
    expect(invalidFormat.stderr).toContain('Error: Unsupported format: xml');
    expect(invalidSeverity.exitCode).toBe(2);
    expect(invalidSeverity.stderr).toContain('Error: Unsupported severity: fatal');
  }, 10000);

  test('applies min-severity to json output', async () => {
    const result = await runCLI(['validate', `${server.baseUrl}/`, '--format', 'json', '--min-severity', 'warning']);

    expect(result.exitCode).toBe(1);
    const payload = JSON.parse(result.stdout);
    expect(JSON.stringify(payload)).not.toContain('"severity": "info"');
    expect(payload.summary.info).toBe(2);
  });

  test('supports disabling rules', async () => {
    const result = await runCLI([
      'validate',
      `${server.baseUrl}/`,
      '--format',
      'json',
      '--disable-rules',
      'meta/title-empty',
      '--disable-rules',
      'headings/missing-h1',
    ]);

    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(JSON.stringify(payload)).not.toContain('meta/title-empty');
    expect(JSON.stringify(payload)).not.toContain('headings/missing-h1');
  });

  test('supports severity overrides', async () => {
    const result = await runCLI([
      'validate',
      `${server.baseUrl}/warning-only`,
      '--format',
      'json',
      '--severity-override',
      'meta/description-missing=error',
    ]);

    expect(result.exitCode).toBe(1);
    const payload = JSON.parse(result.stdout);
    const metaValidation = payload.validations.find((entry: { type: string }) => entry.type === 'meta');
    expect(metaValidation?.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rule: 'meta/description-missing',
          severity: 'error',
        }),
      ]),
    );
  });

  test('returns exit code 0 for a clean page', async () => {
    const result = await runCLI(['validate', `${server.baseUrl}/clean`, '--format', 'json']);

    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.summary.errors).toBe(0);
  });

  test('writes validation output to a file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'seo-solver-validate-'));
    const outputPath = join(dir, 'report.json');
    const result = await runCLI(['validate', `${server.baseUrl}/clean`, '--format', 'json', '--output', outputPath]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain(`Report written to ${outputPath}`);
    expect(JSON.parse(await readFile(outputPath, 'utf8'))).toEqual(
      expect.objectContaining({ url: `${server.baseUrl}/clean` }),
    );
  });

  test('supports selective extractors', async () => {
    const result = await runCLI(['validate', `${server.baseUrl}/`, '--format', 'json', '--targets', 'meta']);

    expect(result.exitCode).toBe(1);
    const payload = JSON.parse(result.stdout);
    expect(payload.validations).toHaveLength(1);
    expect(payload.validations[0].type).toBe('meta');
  });

  test('supports quiet and verbose terminal output', async () => {
    const quiet = await runCLI(['validate', `${server.baseUrl}/`, '--format', 'terminal', '--quiet']);
    const verbose = await runCLI(['validate', `${server.baseUrl}/`, '--format', 'terminal', '--verbose']);

    expect(quiet.exitCode).toBe(1);
    expect(verbose.exitCode).toBe(1);
    expect(verbose.stdout.length).toBeGreaterThan(quiet.stdout.length);
  });

  test('supports markdown and html validation output', async () => {
    const markdown = await runCLI(['validate', `${server.baseUrl}/`, '--format', 'markdown']);
    const html = await runCLI(['validate', `${server.baseUrl}/`, '--format', 'html']);

    expect(markdown.exitCode).toBe(1);
    expect(html.exitCode).toBe(1);
    expect(markdown.stdout).toContain('# SEO Audit:');
    expect(markdown.stdout).toContain('| Severity | Rule | Message |');
    expect(html.stdout.toLowerCase()).toContain('<!doctype html>');
  });

  test('reports timeouts with exit code 2', async () => {
    const result = await runCLI(['validate', `${server.baseUrl}/never`, '--timeout-ms', '50']);

    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain('Fetch error (TIMEOUT)');
  });

  test('retries flaky pages when requested', async () => {
    const result = await runCLI([
      'validate',
      `${server.baseUrl}/retry-html`,
      '--format',
      'json',
      '--retry-attempts',
      '3',
    ]);

    expect(result.exitCode).toBe(0);
    expect(server.getRequestCount('/retry-html')).toBe(3);
    const payload = JSON.parse(result.stdout);
    expect(payload.url).toBe(`${server.baseUrl}/retry-html`);
  });
});

async function createInvalidPageServer() {
  const records = new Map<string, number>();
  const server = createServer((request, response) => {
    const path = new URL(request.url ?? '/', 'http://127.0.0.1').pathname;
    records.set(path, (records.get(path) ?? 0) + 1);

    if (path === '/never') {
      return;
    }

    if (path === '/retry-html') {
      const count = records.get(path) ?? 0;

      if (count < 3) {
        response.writeHead(500, { 'content-type': 'text/plain' });
        response.end(`fail-${count}`);
        return;
      }

      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      response.end(
        '<!doctype html><html><head><title>Healthy Title Example</title><meta name="description" content="This is a sufficiently long meta description for the retry html example page."><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><h1>Primary heading</h1></body></html>',
      );
      return;
    }

    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });

    if (path === '/warning-only') {
      response.end(
        '<!doctype html><html><head><title>Healthy Title Example</title></head><body><h1>Primary heading</h1></body></html>',
      );
      return;
    }

    if (path === '/clean') {
      response.end(
        '<!doctype html><html><head><title>Healthy Title Example</title><meta name="description" content="This is a sufficiently long meta description for the clean page example."><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><h1>Primary heading</h1></body></html>',
      );
      return;
    }

    response.end('<!doctype html><html><head><title></title></head><body><h2>Secondary heading</h2></body></html>');
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
    getRequestCount: (path: string) => records.get(path) ?? 0,
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
