import { afterEach, expect, test } from 'bun:test';
import { once } from 'node:events';
import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

type CliResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

type RouteHandler = (request: IncomingMessage, response: ServerResponse) => void | Promise<void>;

let server: Server | undefined;
let tempDirectories: string[] = [];

afterEach(async () => {
  if (server) {
    server.close();
    await once(server, 'close');
    server = undefined;
  }

  for (const directory of tempDirectories) {
    await rm(directory, { recursive: true, force: true });
  }

  tempDirectories = [];
});

test('cli inspect command runs through the real v2 path for basic fetcher', async () => {
  const baseUrl = await startFixtureServer({
    '/': (_request, response) => {
      respondHtml(
        response,
        '<!doctype html><html lang="en"><head><script type="application/ld+json">{"@type":"Article","headline":"Smoke headline"}</script></head><body></body></html>',
      );
    },
  });

  const result = await runCli(['inspect', baseUrl, '--fetcher', 'basic']);

  expect(result.exitCode).toBe(0);
  expect(result.stderr).toBe('');
  expect(result.stdout).toContain('Extracted');
  expect(result.stdout).toContain('Smoke headline');
});

test('cli diff command runs through the real v2 path for basic fetcher', async () => {
  const baseUrl = await startFixtureServer({
    '/left': (_request, response) => {
      respondHtml(
        response,
        '<!doctype html><html lang="en"><head><script type="application/ld+json">{"@type":"Article","headline":"Left smoke"}</script></head><body></body></html>',
      );
    },
    '/right': (_request, response) => {
      respondHtml(
        response,
        '<!doctype html><html lang="en"><head><script type="application/ld+json">{"@type":"Article","headline":"Right smoke"}</script></head><body></body></html>',
      );
    },
  });

  const result = await runCli(['diff', `${baseUrl}/left`, `${baseUrl}/right`, '--fetcher', 'basic']);

  expect(result.exitCode).toBe(0);
  expect(result.stderr).toBe('');
  expect(result.stdout).toContain('Differences found');
  expect(result.stdout).toContain('headline');
});

test('cli diff --og runs through the real v2 path for opengraph', async () => {
  const baseUrl = await startFixtureServer({
    '/left': (_request, response) => {
      respondHtml(
        response,
        '<!doctype html><html lang="en"><head><meta property="og:title" content="Left OG title" /><meta property="og:description" content="Left description" /></head><body></body></html>',
      );
    },
    '/right': (_request, response) => {
      respondHtml(
        response,
        '<!doctype html><html lang="en"><head><meta property="og:title" content="Right OG title" /><meta property="og:image" content="https://example.test/image.png" /></head><body></body></html>',
      );
    },
  });

  const result = await runCli(['diff', `${baseUrl}/left`, `${baseUrl}/right`, '--fetcher', 'basic', '--og']);

  expect(result.exitCode).toBe(0);
  expect(result.stderr).toBe('');
  expect(result.stdout).toContain('Differences found');
  expect(result.stdout).toContain('og:title');
  expect(result.stdout).toContain('og:image');
});

test('cli validate --og --editor uses artifact path and succeeds', async () => {
  const baseUrl = await startFixtureServer({
    '/': (_request, response) => {
      respondHtml(
        response,
        '<!doctype html><html lang="en"><head><meta property="og:title" content="Editor OG title" /><meta name="twitter:card" content="summary" /></head><body></body></html>',
      );
    },
  });
  const editorPath = await createStubEditor();

  const result = await runCli(['validate', baseUrl, '--fetcher', 'basic', '--og', '--editor', editorPath]);

  expect(result.exitCode).toBe(0);
  expect(result.stderr).toBe('');
  expect(result.stdout).toContain('No validators configured');
});

test('cli validate command runs through the real v2 path and surfaces validation failure', async () => {
  const baseUrl = await startFixtureServer({
    '/': (_request, response) => {
      respondHtml(
        response,
        '<!doctype html><html lang="en"><head><script type="application/ld+json">{"@type":"Article","headline":"Validate smoke"}</script></head><body></body></html>',
      );
    },
    '/schema': (_request, response) => {
      response.writeHead(200, { 'content-type': 'application/ld+json' });
      response.end(JSON.stringify({ '@context': 'https://schema.org' }));
    },
  });

  const result = await runCli(['validate', baseUrl, '--fetcher', 'basic'], {
    SEO_SOLVER_SCHEMA_ORG_URL: `${baseUrl}/schema`,
  });

  expect(result.exitCode).toBe(1);
  expect(result.stderr).toContain('Schema.org validation failed');
  expect(result.stdout.trim()).toBe('');
});

test('cli rejects invalid fetcher ids with meaningful stderr', async () => {
  const result = await runCli(['inspect', 'https://example.test', '--fetcher', 'bogus']);

  expect(result.exitCode).toBe(1);
  expect(result.stderr).toContain('Invalid value for --fetcher');
});

test('cli surfaces fetch failures with non-zero exit code', async () => {
  const baseUrl = await startFixtureServer({
    '/': (_request, response) => {
      response.writeHead(500, { 'content-type': 'text/plain' });
      response.end('boom');
    },
  });

  const result = await runCli(['inspect', baseUrl, '--fetcher', 'basic']);

  expect(result.exitCode).toBe(1);
  expect(result.stderr).toContain('Basic fetch failed');
});

test('cli surfaces malformed extracted content with non-zero exit code', async () => {
  const baseUrl = await startFixtureServer({
    '/': (_request, response) => {
      respondHtml(
        response,
        '<!doctype html><html lang="en"><head><script type="application/ld+json">{ invalid json }</script></head><body></body></html>',
      );
    },
  });

  const result = await runCli(['inspect', baseUrl, '--fetcher', 'basic']);

  expect(result.exitCode).toBe(1);
  expect(result.stderr).toContain('Failed to parse JSON-LD');
});

async function startFixtureServer(routes: Record<string, RouteHandler>): Promise<string> {
  server = createServer(async (request, response) => {
    const path = request.url ?? '/';
    const handler = routes[path];

    if (!handler) {
      response.writeHead(404, { 'content-type': 'text/plain' });
      response.end('not found');
      return;
    }

    await handler(request, response);
  });

  server.listen(0);
  await once(server, 'listening');

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to resolve local test server address');
  }

  return `http://127.0.0.1:${address.port}`;
}

async function runCli(args: string[], envOverrides: Record<string, string> = {}): Promise<CliResult> {
  const proc = Bun.spawn(['bun', 'run', 'src/cli/index.ts', ...args], {
    cwd: '/Users/gavro/projects/seo-solver',
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      ...process.env,
      ...envOverrides,
    },
  });

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  return { exitCode, stdout, stderr };
}

function respondHtml(response: ServerResponse, html: string): void {
  response.writeHead(200, { 'content-type': 'text/html' });
  response.end(html);
}

async function createStubEditor(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'seo-solver-editor-'));
  tempDirectories.push(directory);

  const editorPath = join(directory, 'stub-editor.sh');
  await writeFile(
    editorPath,
    `#!/bin/sh
exit 0
`,
    'utf8',
  );
  await chmod(editorPath, 0o755);
  return editorPath;
}
