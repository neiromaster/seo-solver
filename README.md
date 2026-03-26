# seo-solver

CLI tool for comparing and validating structured data (JSON-LD, OpenGraph) for SEO.

## Features

- **JSON-LD comparison** — Compare Schema.org structured data between pages
- **OpenGraph comparison** — Compare OpenGraph meta tags with `--og` flag
- **Validation mode** — Validate Schema.org data with `--validate` flag
- **Multiple fetch methods** — Playwright (default) or curl with `--curl` flag
- **VS Code diff output** — Generate diff in VS Code format with `--vscode` flag

## Installation

```bash
npm install -g seo-solver
# or
bun install -g seo-solver
```

## Usage

### Compare JSON-LD between two pages

```bash
seo-solver https://example.com https://example.com/page2
```

### Compare OpenGraph tags

```bash
seo-solver https://example.com https://example.com/page2 --og
```

### Validate Schema.org data

```bash
seo-solver https://example.com --validate
```

### Use curl instead of Playwright

```bash
seo-solver https://example.com https://example.com/page2 --curl
```

### Generate VS Code diff

```bash
seo-solver https://example.com https://example.com/page2 --vscode
```

## Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--vscode` | `-v` | Output diff in VS Code format |
| `--curl` | `-c` | Use curl for fetching (faster, no JS rendering) |
| `--og` | `-o` | Compare OpenGraph tags instead of JSON-LD |
| `--validate` | `-V` | Validate Schema.org data (requires single URL) |

## Examples

```bash
# Compare JSON-LD with VS Code output
seo-solver https://example.com https://example.com/new --vscode

# Quick comparison using curl
seo-solver https://example.com https://example.com/updated --curl

# Validate a page's structured data
seo-solver https://example.com --validate
```

## License

MIT © [Maxim (neiromaster) Gavrilenko](https://github.com/neiromaster)
