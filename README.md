# seo-solver

CLI tool for comparing and validating SEO metadata from web pages.

## Features

- Compare JSON-LD between two URLs
- Compare OpenGraph tags between two URLs with `--og`
- Validate JSON-LD on a single URL
- Open diffs in a VS Code-like editor with `diff --editor <command>`
- Open extracted JSON-LD or OpenGraph data in a VS Code-like editor with `validate --editor <command>`
- Fail fast if the requested editor command is not available in `PATH`
- Fetch via `basic` (default), `curl`, or Chrome via `--fetcher`

## Installation

```bash
bun install -g seo-solver
```

## Usage

The CLI uses subcommands:

```bash
seo-solver diff <url1> <url2> [flags]
seo-solver validate <url> [flags]
```

## Examples

```bash
# Compare JSON-LD and open the diff in Cursor
seo-solver diff https://example.com https://example.com/new --editor cursor

# Compare OpenGraph and open the diff in VS Code
seo-solver diff https://example.com https://example.com/new --og --editor code

# Validate a page's JSON-LD
seo-solver validate https://example.com

# Force curl fetching
seo-solver validate https://example.com --fetcher curl

# Launch Chrome via Playwright for browser-based extraction
seo-solver diff https://example.com https://example.com/new --fetcher chrome

# Connect to an existing Chrome instance with remote debugging enabled
seo-solver validate https://example.com --fetcher chrome:9222

# Open extracted metadata in Surf, then continue validation
seo-solver validate https://example.com --editor surf

# Open extracted OpenGraph in Cursor
seo-solver validate https://example.com --og --editor cursor
```

## Options

### `diff`

| Flag | Alias | Description |
|------|-------|-------------|
| `--fetcher <value>` | `-f` | Select fetcher backend: `basic`, `curl`, `chrome`, or `chrome:<port\|host:port\|url>` |
| `--curl` | `-c` | Deprecated: use `--fetcher curl` |
| `--og` | `-o` | Compare OpenGraph instead of JSON-LD |
| `--editor <command>` | `-e` | Open diff in editor |

### `validate`

| Flag | Alias | Description |
|------|-------|-------------|
| `--fetcher <value>` | `-f` | Select fetcher backend: `basic`, `curl`, `chrome`, or `chrome:<port\|host:port\|url>` |
| `--curl` | `-c` | Deprecated: use `--fetcher curl` |
| `--og` | `-o` | Read OpenGraph instead of JSON-LD |
| `--editor <command>` | `-e` | Open extracted metadata in editor |

> If `--editor` is provided, the CLI first checks that the editor command exists in `PATH` and fails immediately if it does not.
>
> Default fetcher is `basic` when no fetcher flag is provided.
>
> `-c` is kept for backward compatibility and prints a deprecation warning. If both `-c` and `--fetcher` are passed, `--fetcher` wins.
>
> `validate --og` fetches and reports OpenGraph tags, but OpenGraph validation itself is not implemented yet.

## License

MIT © [Maxim (neiromaster) Gavrilenko](https://github.com/neiromaster)
