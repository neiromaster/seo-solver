# seo-solver

CLI tool for comparing and validating SEO metadata from web pages.

## Workspace

This repository is a pnpm workspace monorepo. The publishable CLI lives in `apps/seo-solver`, and shared workspace configuration lives under `packages/*`.

## Development

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
```

## Features

- Compare extracted SEO data between two URLs
- Validate extracted SEO and social metadata on a single URL
- Extract raw SEO data without running validation
- List available validation rules from the CLI
- Fetch via `native` (default) or `playwright` via `--fetcher`

## Installation

```bash
pnpm add -g seo-solver
```

## Usage

The CLI uses subcommands:

```bash
seo-solver compare <url1> <url2> [flags]
seo-solver validate <url> [flags]
seo-solver extract <url> [flags]
seo-solver list-rules [flags]
```

## Examples

```bash
# Compare the default extractor set between two pages
seo-solver compare https://example.com https://example.com/new

# Compare only OpenGraph data
seo-solver compare https://example.com https://example.com/new --extractors opengraph

# Validate a page with the default extractor set
seo-solver validate https://example.com

# Use the native fetcher explicitly
seo-solver validate https://example.com --fetcher native

# Use the Playwright fetcher for browser-based comparison
seo-solver compare https://example.com https://example.com/new --fetcher playwright

# Use the Playwright fetcher for validation
seo-solver validate https://example.com --fetcher playwright

# Extract raw metadata without validation
seo-solver extract https://example.com --extractors opengraph,meta

# Validate only OpenGraph-derived metadata
seo-solver validate https://example.com --extractors opengraph

# Limit validation to OpenGraph and meta tags
seo-solver validate https://example.com --extractors opengraph,meta

# Show the available validation rules as JSON
seo-solver list-rules --format json
```

## Options

### `compare`

| Flag | Alias | Description |
|------|-------|-------------|
| `--fetcher <value>` | — | Select fetcher backend: `native` or `playwright` |
| `--extractors <list>` | `-e` | Limit comparison to selected extractors, e.g. `opengraph`, `meta`, `jsonld` |
| `--output <path>` | `-o` | Write comparison output to a file |

### `validate`

| Flag | Alias | Description |
|------|-------|-------------|
| `--fetcher <value>` | — | Select fetcher backend: `native` or `playwright` |
| `--extractors <list>` | `-e` | Limit validation to selected extractors, e.g. `opengraph`, `meta`, `jsonld` |
| `--format <terminal\|json\|markdown\|html>` | `-f` | Choose the report output format |
| `--min-severity <level>` | — | Show diagnostics at or above the selected severity |
| `--disable-rule <rule>` | — | Disable one or more validation rules |
| `--severity-override <rule=severity>` | — | Override severity for a specific rule |
| `--output <path>` | `-o` | Write validation output to a file |

### `extract`

| Flag | Alias | Description |
|------|-------|-------------|
| `--fetcher <value>` | — | Select fetcher backend: `native` or `playwright` |
| `--extractors <list>` | `-e` | Limit extraction to selected extractors |
| `--format <json>` | `-f` | Choose the extract output format |
| `--output <path>` | `-o` | Write extracted JSON output to a file |

### `list-rules`

| Flag | Alias | Description |
|------|-------|-------------|
| `--format <terminal\|json>` | `-f` | Choose human-readable or JSON rule output |
| `--output <path>` | `-o` | Write rule output to a file |

> Default fetcher is `native` when no fetcher flag is provided.
>
> `validate` runs the configured extractor set and validates the extracted metadata. Use `--extractors` to focus on specific sources such as OpenGraph, meta tags, or JSON-LD.

## License

MIT © [Maxim (neiromaster) Gavrilenko](https://github.com/neiromaster)
