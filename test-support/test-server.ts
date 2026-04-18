import type { IncomingMessage } from 'node:http';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';

type RequestRecord = {
  count: number;
  headers: Record<string, string | string[] | undefined>;
};

export type TestServer = {
  baseUrl: string;
  close: () => Promise<void>;
  getRequestCount: (path: string) => number;
  getRequestHeaders: (path: string) => Record<string, string | string[] | undefined>;
  reset: () => void;
};

export async function createTestServer(): Promise<TestServer> {
  const records = new Map<string, RequestRecord>();
  const server = createServer((request, response) => {
    const path = new URL(request.url ?? '/', 'http://127.0.0.1').pathname;
    recordRequest(records, path, request);

    switch (path) {
      case '/': {
        response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        response.end('<!doctype html><html><head><title>Home</title></head><body><h1>Hello</h1></body></html>');
        return;
      }

      case '/robots.txt': {
        response.writeHead(200, { 'content-type': 'text/plain' });
        response.end('User-agent: *\nDisallow: /admin');
        return;
      }

      case '/data.json': {
        response.writeHead(200, { 'content-type': 'application/json' });
        response.end(JSON.stringify({ key: 'value' }));
        return;
      }

      case '/redirect': {
        response.writeHead(301, { location: '/' });
        response.end();
        return;
      }

      case '/double-redirect': {
        response.writeHead(302, { location: '/redirect' });
        response.end();
        return;
      }

      case '/redirect-loop': {
        response.writeHead(301, { location: '/redirect-loop' });
        response.end();
        return;
      }

      case '/redirect-relative': {
        response.writeHead(301, { location: '/' });
        response.end();
        return;
      }

      case '/slow': {
        setTimeout(() => {
          response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
          response.end('<html><body>slow</body></html>');
        }, 500);
        return;
      }

      case '/never': {
        return;
      }

      case '/retry-then-ok': {
        const attempt = records.get(path)?.count ?? 0;
        if (attempt < 3) {
          response.writeHead(500, { 'content-type': 'text/plain' });
          response.end(`fail-${attempt}`);
          return;
        }

        response.writeHead(200, { 'content-type': 'text/plain' });
        response.end('ok');
        return;
      }

      case '/always-500': {
        response.writeHead(500, { 'content-type': 'text/plain' });
        response.end('always failing');
        return;
      }

      case '/rate-limited': {
        const attempt = records.get(path)?.count ?? 0;
        if (attempt < 2) {
          response.writeHead(429, {
            'content-type': 'text/plain',
            'retry-after': '1',
          });
          response.end('retry later');
          return;
        }

        response.writeHead(200, { 'content-type': 'text/plain' });
        response.end('ok');
        return;
      }

      case '/rate-limited-date': {
        const attempt = records.get(path)?.count ?? 0;
        if (attempt < 2) {
          response.writeHead(429, {
            'content-type': 'text/plain',
            'retry-after': new Date(Date.now() + 1000).toUTCString(),
          });
          response.end('retry later');
          return;
        }

        response.writeHead(200, { 'content-type': 'text/plain' });
        response.end('ok');
        return;
      }

      case '/charset-latin': {
        const body = Buffer.from('<html><body>olá</body></html>', 'latin1');
        response.writeHead(200, { 'content-type': 'text/html; charset=iso-8859-1' });
        response.end(body);
        return;
      }

      case '/no-content-type': {
        response.statusCode = 200;
        response.end('mystery');
        return;
      }

      case '/empty-body': {
        response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        response.end('');
        return;
      }

      case '/rendered': {
        response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        response.end(
          `<!doctype html><html><head><title>Render</title></head><body><div id="app">raw</div><script>document.getElementById('app').textContent='hydrated';const meta=document.createElement('meta');meta.setAttribute('property','og:title');meta.setAttribute('content','Hydrated Title');document.head.appendChild(meta);</script><img src="/image.png" /></body></html>`,
        );
        return;
      }

      case '/viewport': {
        response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        response.end(
          `<!doctype html><html><body><script>document.body.innerHTML = window.innerWidth >= 1000 ? '<div>desktop</div>' : '<div>mobile</div>';</script></body></html>`,
        );
        return;
      }

      case '/image.png': {
        response.writeHead(200, { 'content-type': 'image/png' });
        response.end(Buffer.from('89504E470D0A1A0A', 'hex'));
        return;
      }

      default: {
        response.writeHead(404, { 'content-type': 'text/plain' });
        response.end('not found');
      }
    }
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
  const baseUrl = `http://127.0.0.1:${address.port}`;

  return {
    baseUrl,
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
    getRequestCount: (path) => records.get(path)?.count ?? 0,
    getRequestHeaders: (path) => records.get(path)?.headers ?? {},
    reset: () => records.clear(),
  };
}

function recordRequest(records: Map<string, RequestRecord>, path: string, request: IncomingMessage): void {
  const current = records.get(path);
  records.set(path, {
    count: (current?.count ?? 0) + 1,
    headers: request.headers,
  });
}
