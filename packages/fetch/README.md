# @seo-solver/fetch

`@seo-solver/fetch` is the base fetch layer for the whole workspace. Use it when you want one stable way to fetch a page, normalize the response, and hand the result to extraction, comparison, or validation code.

## Installation

```bash
pnpm add @seo-solver/fetch
```

## What this package gives you

- a simple `fetchUrl()` API for one-off requests
- a reusable `createFetcher()` API when you want to keep a fetcher around
- a structured fetch result that downstream packages already understand
- structured fetch errors with stable error codes
- an advanced surface for backend registration and shared retry execution

## Simple API

If you just want to fetch a URL and work with a normalized result, use the root package.

```ts
import { fetchUrl } from '@seo-solver/fetch';

const result = await fetchUrl('https://example.com');

console.log(result.url);
console.log(result.statusCode);
console.log(result.resourceType);
```

The returned object is the same canonical fetch shape used by the rest of the `seo-solver` packages. If you want to reuse a fetcher instance, use `createFetcher()` rather than instantiating an implementation class directly.

## Advanced API

The application uses the advanced surface when it needs backend selection and shared retry behavior rather than a one-off fetch helper.

```ts
import { createFetcher } from '@seo-solver/fetch';
import {
  createSharedRetryExecutor,
  registerBackend,
  registerNativeBackend,
  resolveBackend,
} from '@seo-solver/fetch/advanced';

registerNativeBackend();

registerBackend('custom', async () => ({
  createFetcher(config) {
    return createFetcher(config);
  },
}));

const backend = await resolveBackend('native');
const fetcher = backend.createFetcher();
```

Reach for `@seo-solver/fetch/advanced` when you are wiring backends, retries, or orchestration. Backend registration is explicit: importing the module does not register `native` by itself.

## Error model

Fetch failures use a structured contract with stable `code` values and retryability hints. That makes it safer to branch on fetch errors without coupling your code to a backend-specific error class.

## Related docs and examples

- [docs/advanced.md](docs/advanced.md) — backend registry and shared retry notes
- [examples/basic-fetch.ts](examples/basic-fetch.ts) — minimal fetch example
