# seo-solver CLI

`seo-solver` is the publishable CLI package in this workspace. It pulls together the fetch, extract, compare, validate, and report packages into a single command-line tool for SEO audits and page-to-page comparisons.

## Installation

```bash
pnpm add -g seo-solver
```

If you want the optional Playwright backend:

```bash
pnpm add -g @seo-solver/fetch-playwright playwright
pnpm exec playwright install
```

## What this package gives you

- one CLI for extraction, validation, comparison, and rule discovery
- a thin orchestration layer over the workspace packages
- the final public command vocabulary used by the project
- optional browser-backed fetching through Playwright

## Simple API

The main entrypoint is the installed `seo-solver` command.

```bash
seo-solver validate https://example.com
seo-solver compare https://example.com https://example.com/new
seo-solver extract https://example.com --format json
seo-solver list-rules --format json
```

For most users, that is the whole API: pass URLs in, get structured output back.

## Advanced API

The CLI is itself built as a package. If you are extending the application or embedding parts of it in another tool, the internal structure is split into:

- `src/commands/` — thin command entrypoints
- `src/workflows/` — orchestration over package-owned APIs
- `src/cli-support/` — error handling, fetcher resolution, output writing, and reporter setup

The executable entrypoint is just:

```ts
import { run } from 'cmd-ts';
import { app } from './src/app.js';

run(app, process.argv.slice(2));
```

That means the package is intentionally small: the interesting behavior lives in the workspace packages it orchestrates.

## Commands

```bash
seo-solver compare <url-a> <url-b> [flags]
seo-solver validate <url> [flags]
seo-solver extract <url> [flags]
seo-solver list-rules [flags]
```

## Useful examples

```bash
# Compare only selected targets
seo-solver compare https://example.com https://example.com/new --targets opengraph,meta

# Validate with pure JSON-LD validation (default)
seo-solver validate https://example.com --jsonld-runtime off

# Validate with browser-backed fetching
seo-solver validate https://example.com --fetcher playwright

# Extract a focused subset of targets as JSON
seo-solver extract https://example.com --targets meta,opengraph --format json

# Print the full rule catalog as JSON
seo-solver list-rules --format json
```

## Key flags

### Shared fetch flags

These flags are available on `compare`, `validate`, and `extract`:

- `--fetcher <native|playwright>`
- `--timeout-ms <ms>`
- `--user-agent <string>`
- `--retry-attempts <n>`
- `--retry-delay-ms <ms>`
- `--retry-backoff <fixed|exponential>`
- `--respect-retry-after <true|false>`

### Comparison and extraction

- `--targets <list>` / `-e` selects a subset of package-owned targets such as `meta`, `opengraph`, `jsonld`, or `robotsTxt`

### Validation-specific

- `--disable-rules <selector>` supports exact ids and wildcard selectors like `opengraph/*`
- `--severity-override <rule=severity>` is strict and will fail on unknown selectors
- `--jsonld-runtime <adobe|off>` controls optional runtime JSON-LD validation
- `--jsonld-cache-file`, `--jsonld-schema-url`, `--jsonld-schema-ttl-ms` configure the optional runtime path

## Related package docs

This package is mostly orchestration. For the real domain APIs, see:

- [packages/fetch](../../packages/fetch/README.md)
- [packages/fetch-playwright](../../packages/fetch-playwright/README.md)
- [packages/extract](../../packages/extract/README.md)
- [packages/compare](../../packages/compare/README.md)
- [packages/validate](../../packages/validate/README.md)
- [packages/report](../../packages/report/README.md)
- [packages/types](../../packages/types/README.md)

## Package notes

- The package is published as `seo-solver`.
- The optional Playwright backend is declared as a peer dependency, not a hard dependency.
- The published package ships the built CLI from `dist/index.js`.
