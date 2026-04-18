import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { buildCLI, runBuiltCLI } from '../e2e/helpers/run-cli.js';
import { createTestServer, type TestServer } from '../e2e/helpers/test-server.js';

describe('command dist smoke tests', () => {
  let sharedServer: TestServer;
  let validateServer: Awaited<ReturnType<typeof createValidateSmokeServer>>;

  beforeAll(async () => {
    const buildResult = await buildCLI();
    expect(buildResult.exitCode).toBe(0);

    sharedServer = await createTestServer();
    validateServer = await createValidateSmokeServer();
  }, 120000);

  afterAll(async () => {
    await Promise.all([sharedServer.close(), validateServer.close()]);
  });

  test('compare command runs from dist against identical pages', async () => {
    const result = await runBuiltCLI([
      'compare',
      `${sharedServer.baseUrl}/`,
      `${sharedServer.baseUrl}/`,
      '--format',
      'json',
    ]);

    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout) as {
      urlA: string;
      urlB: string;
      comparisons: unknown[];
    };
    expect(payload.urlA).toBe(`${sharedServer.baseUrl}/`);
    expect(payload.urlB).toBe(`${sharedServer.baseUrl}/`);
    expect(payload.comparisons).toEqual(expect.any(Array));
  }, 10000);

  test('extract command runs from dist and prints extraction json', async () => {
    const result = await runBuiltCLI(['extract', `${sharedServer.baseUrl}/`]);

    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout) as {
      source: { url: string; statusCode: number };
      data: object;
    };
    expect(payload.source.url).toBe(`${sharedServer.baseUrl}/`);
    expect(payload.source.statusCode).toBe(200);
    expect(payload.data).toEqual(expect.any(Object));
  }, 10000);

  test('validate command runs from dist against a clean page', async () => {
    const result = await runBuiltCLI(['validate', `${validateServer.baseUrl}/clean`, '--format', 'json']);

    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout) as {
      url: string;
      summary: { errors: number };
      validations: unknown[];
    };
    expect(payload.url).toBe(`${validateServer.baseUrl}/clean`);
    expect(payload.summary.errors).toBe(0);
    expect(payload.validations).toEqual(expect.any(Array));
  }, 10000);
});

async function createValidateSmokeServer() {
  const server = createServer((request, response) => {
    const path = new URL(request.url ?? '/', 'http://127.0.0.1').pathname;

    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });

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
