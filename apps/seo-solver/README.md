# seo-solver

CLI tool for SEO audits, page-to-page comparisons, and extracting SEO data from HTML.

Use `seo-solver` to check titles, descriptions, canonical tags, Open Graph, JSON-LD, robots.txt, and other SEO signals from the terminal before a release, in CI, or while comparing production against a preview build.

```bash
seo-solver validate https://example.com
```

## Why seo-solver?

SEO regressions are easy to miss. A template change can drop a canonical tag, break Open Graph data, or change structured data without anyone noticing until after release.

`seo-solver` helps answer three practical questions:

- what SEO data is on this page?
- does it pass validation?
- what changed between one version of a page and another?

## Installation

`seo-solver` targets **Node 22+** and is published as the `seo-solver` CLI package.

You can use the CLI without installing it globally, or install it with the package manager you already use.

### Run without installing

#### pnpm

```bash
pnpm dlx seo-solver validate https://example.com
```

#### npm

```bash
npx seo-solver validate https://example.com
```

#### Yarn

```bash
yarn dlx seo-solver validate https://example.com
```

#### Bun

```bash
bunx seo-solver validate https://example.com
```

### Install globally

#### pnpm

```bash
pnpm add -g seo-solver
```

#### npm

```bash
npm install -g seo-solver
```

#### Yarn

```bash
yarn global add seo-solver
```

#### Bun

```bash
bun add --global seo-solver
```

### Optional Playwright backend

If you need browser-backed fetching for JavaScript-heavy pages, install the optional Playwright backend and browser binaries with your package manager of choice:

#### pnpm

```bash
pnpm add -g @seo-solver/fetch-playwright playwright
pnpm exec playwright install
```

#### npm

```bash
npm install -g @seo-solver/fetch-playwright playwright
npx playwright install
```

#### Yarn

```bash
yarn global add @seo-solver/fetch-playwright playwright
yarn playwright install
```

#### Bun

```bash
bun add --global @seo-solver/fetch-playwright playwright
bunx playwright install
```

## Quick start

Validate a page:

```bash
seo-solver validate https://example.com
```

Compare production and preview:

```bash
seo-solver compare https://example.com https://preview.example.com
```

Extract normalized SEO data as JSON:

```bash
seo-solver extract https://example.com --format json
```

Print the current validation rule catalog:

```bash
seo-solver list-rules
```

## Commands

| Command | Purpose |
| --- | --- |
| `seo-solver validate <url>` | Validate one page against SEO rules |
| `seo-solver compare <url-a> <url-b>` | Compare SEO data between two pages |
| `seo-solver extract <url>` | Extract normalized SEO data without validation |
| `seo-solver list-rules` | Print the available validation rules |

## Common use cases

### Check a page before release

```bash
seo-solver validate https://preview.example.com
```

Use this before shipping a landing page, article, product page, or generated HTML.

### Compare production and a new version

```bash
seo-solver compare https://example.com https://preview.example.com
```

Use this to spot unexpected changes in title, description, canonical, Open Graph, JSON-LD, robots.txt, and other extracted targets.

### Extract SEO data for scripts or CI

```bash
seo-solver extract https://example.com --targets meta,opengraph,jsonld --format json
```

Use this when you want structured output for automation or custom checks.

### Open artifacts in your editor

```bash
seo-solver extract https://example.com --editor code
```

Built-in editor presets are `code`, `cursor`, `surf`, and `zed`.

## Browser-backed fetching

By default, the CLI uses the native fetcher. For pages that need browser-like behavior, install the optional Playwright backend and run:

```bash
seo-solver validate https://example.com --fetcher playwright
```

## More examples

```bash
# Compare only selected targets
seo-solver compare https://example.com https://preview.example.com --targets opengraph,meta

# Validate with pure JSON-LD validation (default)
seo-solver validate https://example.com --jsonld-runtime off

# Disable selected rules
seo-solver validate https://example.com --disable-rules opengraph/*

# Override rule severity
seo-solver validate https://example.com --severity-override opengraph/description-missing=error

# Keep normal compare output and also open diff artifacts in VS Code
seo-solver compare https://example.com https://preview.example.com --format json --editor code
```

## Documentation

- [CLI reference](./docs/cli-reference.md)
- [CLI internals](../../docs/architecture/cli-internals.md)
- [Monorepo conventions](../../docs/architecture/monorepo-conventions.md)
- [packages/fetch](../../packages/fetch/README.md)
- [packages/fetch-playwright](../../packages/fetch-playwright/README.md)
- [packages/extract](../../packages/extract/README.md)
- [packages/compare](../../packages/compare/README.md)
- [packages/validate](../../packages/validate/README.md)
- [packages/report](../../packages/report/README.md)
- [packages/types](../../packages/types/README.md)

## License

MIT
