# seo-solver

`seo-solver` is a pnpm workspace that builds a publishable CLI and a set of smaller packages around fetching, extraction, comparison, validation, reporting, and shared contracts for SEO metadata analysis.

If you only care about using the CLI, jump to the install and usage sections below. If you want to use the building blocks separately, each publishable package under `packages/` now has its own README with both a simple API and the more advanced package-level API used by the application.

## What is in this repository?

- [`apps/seo-solver`](apps/seo-solver/README.md) — the publishable CLI package
- [`packages/fetch`](packages/fetch/README.md) — normalized fetching and backend registry
- [`packages/fetch-playwright`](packages/fetch-playwright/README.md) — optional Playwright-backed fetch backend
- [`packages/extract`](packages/extract/README.md) — page-level extraction and target catalog
- [`packages/compare`](packages/compare/README.md) — page-to-page SEO comparison
- [`packages/validate`](packages/validate/README.md) — validation, rule catalog, and severity overrides
- [`packages/report`](packages/report/README.md) — formatting and status helpers
- [`packages/types`](packages/types/README.md) — shared type contracts and advanced type subpaths

## Development

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

## Install the CLI

```bash
pnpm add -g seo-solver
```

If you want browser-backed fetching, install the optional Playwright backend and browser binaries too:

```bash
pnpm add -g @seo-solver/fetch-playwright playwright
pnpm exec playwright install
```

## CLI overview

The CLI exposes four commands:

```bash
seo-solver compare <url-a> <url-b> [flags]
seo-solver validate <url> [flags]
seo-solver extract <url> [flags]
seo-solver list-rules [flags]
```

The default fetcher is `native`. When you pass `--fetcher playwright`, the CLI will use the optional Playwright backend instead.

## Common examples

```bash
# Compare two pages using the default target set
seo-solver compare https://example.com https://example.com/new

# Compare only selected targets
seo-solver compare https://example.com https://example.com/new --targets opengraph,meta

# Validate one page with pure JSON-LD validation (the default)
seo-solver validate https://example.com --jsonld-runtime off

# Validate one page with browser-backed fetching
seo-solver validate https://example.com --fetcher playwright

# Extract only selected targets as JSON
seo-solver extract https://example.com --targets meta,opengraph --format json

# Print the current validation rule catalog as JSON
seo-solver list-rules --format json
```

## Final CLI vocabulary

### Shared fetch flags

These flags are available on `compare`, `validate`, and `extract`.

| Flag | Meaning |
|---|---|
| `--fetcher <native\|playwright>` | choose the fetch backend |
| `--timeout-ms <ms>` | request timeout in milliseconds |
| `--user-agent <string>` | override the HTTP user agent |
| `--retry-attempts <n>` | number of retry attempts |
| `--retry-delay-ms <ms>` | delay between retries |
| `--retry-backoff <fixed\|exponential>` | retry backoff strategy |
| `--respect-retry-after <true\|false>` | honor `Retry-After` headers |

### `compare`

| Flag | Meaning |
|---|---|
| `--targets <list>` / `-e` | compare only selected targets such as `meta`, `opengraph`, `jsonld`, `robotsTxt` |
| `--output <path>` / `-o` | write comparison output to a file |

### `validate`

| Flag | Meaning |
|---|---|
| `--targets <list>` / `-e` | validate only selected targets |
| `--format <terminal\|json\|markdown\|html>` / `-f` | choose output format |
| `--min-severity <level>` | filter displayed diagnostics |
| `--disable-rules <selector>` | disable exact rule ids or wildcard selectors like `opengraph/*` |
| `--severity-override <rule=severity>` | override rule severity with strict selector validation |
| `--jsonld-runtime <adobe\|off>` | opt into runtime JSON-LD validation or keep it pure |
| `--jsonld-cache-file <path>` | optional schema cache file |
| `--jsonld-schema-url <url>` | override the schema URL |
| `--jsonld-schema-ttl-ms <ms>` | schema cache TTL in milliseconds |
| `--output <path>` / `-o` | write validation output to a file |

### `extract`

| Flag | Meaning |
|---|---|
| `--targets <list>` / `-e` | extract only selected targets |
| `--format <json>` / `-f` | choose output format |
| `--output <path>` / `-o` | write extraction output to a file |

### `list-rules`

| Flag | Meaning |
|---|---|
| `--format <terminal\|json>` / `-f` | choose human-readable or JSON output |
| `--output <path>` / `-o` | write the rule catalog to a file |

## Package-level usage

If you want to build on the pieces instead of only using the CLI, start here:

- [packages/fetch/README.md](packages/fetch/README.md)
- [packages/fetch-playwright/README.md](packages/fetch-playwright/README.md)
- [packages/extract/README.md](packages/extract/README.md)
- [packages/compare/README.md](packages/compare/README.md)
- [packages/validate/README.md](packages/validate/README.md)
- [packages/report/README.md](packages/report/README.md)
- [packages/types/README.md](packages/types/README.md)

Those README files explain both the simple, human-friendly API and the more advanced API used inside the application.

## License

MIT © [Maxim (neiromaster) Gavrilenko](https://github.com/neiromaster)
