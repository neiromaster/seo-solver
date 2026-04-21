# @seo-solver/extract

`@seo-solver/extract` turns fetched pages into structured SEO data. It owns the canonical target catalog for the workspace, so packages and applications can all talk about the same extraction targets.

## Installation

```bash
pnpm add @seo-solver/extract
```

## What this package gives you

- page-level extraction results with a stable `{ source, data, errors }` wrapper and target-driven sparse `data`
- small helpers for reading target data and status from `ExtractedPage`
- a package-owned `listTargets()` catalog
- simple helpers for HTML pages and robots.txt
- an advanced pipeline surface for custom extractors and low-level extraction work

## Simple API

Use the root API when you want extraction results that are ready to pass into comparison or validation.

The basic API returns the stable `ExtractedPage` contract from `@seo-solver/types/extract`:

| Need | Public import | Result shape |
| --- | --- | --- |
| Extract from an HTML string | `extractHtml` from `@seo-solver/extract` | `ExtractedPage` |
| Extract from a `FetchResult` | `extractPage` from `@seo-solver/extract` | `ExtractedPage` |
| Extract from a robots.txt body | `extractRobotsText` from `@seo-solver/extract` | `ExtractedPage` |
| Inspect supported targets | `listTargets` from `@seo-solver/extract` | `TargetCatalogEntry[]` |
| Read selected target data safely | `getTargetData`, `getTargetStatus`, `hasTargetData` from `@seo-solver/extract` | Typed target data, status, or boolean |
| Type the result in your app | `ExtractedPage` from `@seo-solver/types/extract` | Stable page-level contract |
| Build custom low-level pipelines | `@seo-solver/extract/advanced` | `ExtractionEnvelope[]` |

For third-party applications, prefer the `ExtractedPage` result unless you intentionally need custom extractor instances or raw pipeline envelopes.

```ts
import { extractHtml, getTargetData, getTargetStatus, hasTargetData, listTargets } from '@seo-solver/extract';
import type { ExtractedPage } from '@seo-solver/types/extract';

const page: ExtractedPage = extractHtml('<!doctype html><html><head><title>Hello</title></head></html>', {
  targets: ['meta', 'headings'],
});

console.log(page.source.url);
console.log(getTargetData(page, 'meta')?.title ?? 'No title found');
console.log(hasTargetData(page, 'headings') ? getTargetData(page, 'headings')?.length : 0);
console.log(getTargetStatus(page, 'opengraph') ?? 'not selected');
console.log(page.errors.map((error) => error.message));
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
- **targetStatus** records whether each selected or default-selected target is `present` or `missing`
- **errors** contains extractor-level warnings in a package-owned format

When reading `data`, treat it as target-driven and sparse: a selected target can have data, be present with `null`, or be absent when it was not selected. Use `targetStatus` when your app needs to tell the difference between “this target was checked and missing” and “this target was not part of this extraction.”

The target helper functions encode those checks for common consumers:

- `getTargetData(page, target)` returns typed target data or `null`
- `getTargetStatus(page, target)` returns `present`, `missing`, or `undefined` when the target was not selected
- `hasTargetData(page, target)` returns `true` only when the selected target produced data

## Related docs and examples

- [docs/advanced.md](docs/advanced.md) — pipeline and custom extractor usage
- [examples/basic-extract.ts](examples/basic-extract.ts) — simple extraction example
- [examples/advanced-pipeline.ts](examples/advanced-pipeline.ts) — low-level pipeline example
