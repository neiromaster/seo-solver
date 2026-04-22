# CLI internals

This document covers the internal structure of the published `seo-solver` CLI package. It is for contributors and maintainers, not day-to-day CLI users.

## Package role

`apps/seo-solver` is the publishable CLI package in this workspace. It pulls together the fetch, extract, compare, validate, and report packages into a single command-line tool for SEO audits and page-to-page comparisons.

The package stays intentionally small. Most domain behavior lives in the workspace packages it orchestrates.

## Internal structure

The CLI package is split into a few focused areas:

- `src/commands/` — thin command entrypoints
- `src/workflows/` — orchestration over package-owned APIs
- `src/cli-support/` — error handling, fetcher resolution, output writing, editor support, and reporter setup
- `src/flags/` — reusable CLI flag definitions and parsing helpers

## Entry point

The executable entrypoint is intentionally minimal:

```ts
import { run } from 'cmd-ts';
import { app } from './src/app.js';

run(app, process.argv.slice(2));
```

Command wiring lives in `src/app.ts`, which registers the public CLI vocabulary:

- `validate`
- `compare`
- `extract`
- `list-rules`

## Publishing and artifact notes

The package is published as `seo-solver`.

Important packaging constraints:

- the published CLI ships a single runtime entry at `dist/index.js`
- the CLI is bundled as a self-contained artifact
- `@seo-solver/fetch-playwright` stays optional and external rather than bundled into the default install
- the optional Playwright backend is declared through peer dependency metadata

For the full bundling and publish contract, see [monorepo conventions](./monorepo-conventions.md).

## Related package docs

If you want the lower-level APIs instead of the CLI wrapper, start with these package docs:

- [packages/fetch](../../packages/fetch/README.md)
- [packages/fetch-playwright](../../packages/fetch-playwright/README.md)
- [packages/extract](../../packages/extract/README.md)
- [packages/compare](../../packages/compare/README.md)
- [packages/validate](../../packages/validate/README.md)
- [packages/report](../../packages/report/README.md)
- [packages/types](../../packages/types/README.md)
