# @seo-solver/compare

`@seo-solver/compare` compares two arbitrary values and returns structured diffs. Use it when the question is “what changed between these two objects?” and reach for the advanced entrypoint when you need the SEO-specific page comparison pipeline.

## Installation

```bash
pnpm add @seo-solver/compare
```

## What this package gives you

- a generic `compareObjects()` API for comparing arbitrary values
- a low-level `diff()` helper when you want raw diff entries directly
- an advanced SEO comparison surface for extracted pages, comparators, and pipelines

## Base API

```ts
import { compareObjects } from '@seo-solver/compare';

const result = compareObjects(
  { title: 'Before', meta: { description: 'Old description' } },
  { title: 'After', meta: { description: 'New description' } },
);

console.log(result.diffs);
```

Use the root package when you want generic object comparison without pulling in the SEO page-comparison surface.

## Advanced API

Use the advanced surface when you need the SEO page-comparison pipeline, comparator-level control, or direct diff helpers.

```ts
import {
  comparePages,
  createComparisonPipeline,
  diff,
  GenericComparator,
  HeadingsComparator,
} from '@seo-solver/compare/advanced';

const pipeline = createComparisonPipeline({ ignoreArrayOrder: true });
const report = comparePages(leftPage, rightPage);
```

Use `@seo-solver/compare/advanced` when you are intentionally building around extracted-page comparison, comparators, and pipeline internals.

## Related docs and examples

- [docs/advanced.md](docs/advanced.md) — comparator and pipeline usage
- [examples/basic-compare.ts](examples/basic-compare.ts) — root API example
- [examples/advanced-pipeline.ts](examples/advanced-pipeline.ts) — low-level comparator pipeline example
