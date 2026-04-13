# @seo-solver/fetch-playwright

`@seo-solver/fetch-playwright` is an optional Playwright-backed fetch implementation. It speaks the same fetch contract as `@seo-solver/fetch`, but uses a browser engine when you need browser-like loading behavior.

## Installation

```bash
pnpm add @seo-solver/fetch-playwright playwright
pnpm exec playwright install
```

## What this package gives you

- a simple `fetchUrl()` helper with the same result shape as `@seo-solver/fetch`
- a reusable `createFetcher()` API for longer-lived browser-backed fetching
- compatibility with the shared fetch backend model used by the CLI
- a clean path for opting into browser-based fetching without changing downstream extraction or validation code

## Simple API

```ts
import { fetchUrl } from '@seo-solver/fetch-playwright';

const result = await fetchUrl('https://example.com');

console.log(result.statusCode);
console.log(result.url);
```

This is the easiest way to fetch through Playwright while keeping the same normalized result contract used elsewhere in the monorepo.

## Advanced API

The application uses the reusable fetcher form when it wants to control the backend lifecycle explicitly.

```ts
import { createFetcher } from '@seo-solver/fetch-playwright';

const fetcher = createFetcher();

try {
  const result = await fetcher.fetch('https://example.com');
  console.log(result.resourceType);
} finally {
  await fetcher.dispose();
}
```

Use the advanced form when you want to reuse the same backend instance across multiple requests.

## Before you use it

This package assumes Playwright is installed and browser binaries are available. If those prerequisites are missing, the higher-level CLI path will surface a clear install hint instead of failing silently.

## Related docs and examples

- `docs/advanced.md` — reusable fetcher usage
- `examples/basic-fetch.ts` — minimal browser-backed fetch example
