# @seo-solver/extract

`@seo-solver/extract` turns fetched pages into structured SEO data. It owns the canonical target catalog for the workspace, so packages and applications can all talk about the same extraction targets.

## Installation

```bash
pnpm add @seo-solver/extract
```

## What this package gives you

- page-level extraction results with a stable `{ source, data, errors }` wrapper and target-driven sparse `data`
- a package-owned `listTargets()` catalog
- simple helpers for HTML pages and robots.txt
- an advanced pipeline surface for custom extractors and low-level extraction work

## Simple API

Use the root API when you want extraction results that are ready to pass into comparison or validation.

```ts
import { extractHtml, listTargets } from '@seo-solver/extract';

const page = extractHtml('<!doctype html><html><head><title>Hello</title></head></html>', {
  targets: ['meta', 'headings'],
});

console.log(page.source.url);
console.log(page.data.meta);
console.log(page.data.headings);
console.log(page.errors);
console.log(listTargets().map((target) => target.key));
```

If you already have a canonical fetch result from `@seo-solver/fetch`, use `extractPage()`.

If you specifically want to parse a robots.txt body, there is also a dedicated helper:

```ts
import { extractRobotsText } from '@seo-solver/extract';

const robotsPage = extractRobotsText('User-agent: *\nDisallow: /admin');

console.log(robotsPage.data.robotsTxt);
```

## Advanced API

The application uses the advanced surface when it needs direct access to pipelines or extractor classes.

```ts
import { listTargets } from '@seo-solver/extract';
import { createExtractorPipeline, MetaTagsExtractor } from '@seo-solver/extract/advanced';

const pipeline = createExtractorPipeline({ targets: listTargets().map((entry) => entry.key) });
const customOnly = createExtractorPipeline({ targets: [new MetaTagsExtractor()] });
```

Use `@seo-solver/extract/advanced` when you intentionally want low-level extractor envelopes, pipeline control, or custom extractor injection. For normal consumers, the page-level root API is the better fit.

## Core concepts

- **targets** are the public selection vocabulary (`meta`, `opengraph`, `jsonld`, `robotsTxt`, and so on)
- **source** describes what was fetched and from where
- **data** contains only the selected or default-selected targets; requested targets with no extracted data remain present as `null`
- **errors** contains extractor-level warnings in a package-owned format

## Related docs and examples

- [docs/advanced.md](docs/advanced.md) — pipeline and custom extractor usage
- [examples/basic-extract.ts](examples/basic-extract.ts) — simple extraction example
- [examples/advanced-pipeline.ts](examples/advanced-pipeline.ts) — low-level pipeline example
