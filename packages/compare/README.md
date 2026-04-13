# @seo-solver/compare

`@seo-solver/compare` compares two extracted pages and returns a structured comparison report. It is the package you reach for when the question is “what changed between these two pages?”

## Installation

```bash
pnpm add @seo-solver/compare
```

## What this package gives you

- a simple `comparePages()` API for page-to-page comparisons
- structured comparison reports with fetch metadata and per-target diffs
- support for target selection and ignore rules
- an advanced comparator and diff surface when you need lower-level control

## Simple API

```ts
import { comparePages } from '@seo-solver/compare';

const report = comparePages(leftPage, rightPage, {
  targets: ['meta', 'opengraph'],
});

console.log(report.comparisons);
```

This is the API to use when you already have two extracted pages and want a finished comparison report back.

## Advanced API

The application and package internals use the advanced surface when they need comparator-level control or direct diff helpers.

```ts
import {
  createComparisonPipeline,
  diff,
  GenericComparator,
  HeadingsComparator,
} from '@seo-solver/compare/advanced';

const pipeline = createComparisonPipeline({ ignoreArrayOrder: true });
```

Use `@seo-solver/compare/advanced` when you are intentionally building around comparators and pipeline internals. For most consumers, `comparePages()` is the right place to start.

## Related docs and examples

- [docs/advanced.md](docs/advanced.md) — comparator and pipeline usage
- [examples/basic-compare.ts](examples/basic-compare.ts) — root API example
- [examples/advanced-pipeline.ts](examples/advanced-pipeline.ts) — low-level comparator pipeline example
