# @seo-solver/types

`@seo-solver/types` is the shared contract package for the workspace. Use it when you want stable boundaries between packages without importing implementation code.

## Installation

```bash
pnpm add @seo-solver/types
```

## What this package gives you

- stable domain-specific type subpaths for `fetch`, `extract`, `compare`, `validate`, and `report`
- explicit advanced subpaths for low-level orchestration types
- a clear split between stable public contracts and advanced internal coordination surfaces

## Simple API

Most consumers should import only the stable domain contracts they actually need.

```ts
import type { FetchResult } from '@seo-solver/types/fetch';
import type { ExtractedPage } from '@seo-solver/types/extract';
import type { ComparisonReport } from '@seo-solver/types/compare';
import type { ValidationReport } from '@seo-solver/types/validate';
import type { Reporter } from '@seo-solver/types/report';
```

This keeps your imports aligned with the package boundary you are actually depending on.

## Advanced API

If you are building package internals or low-level orchestration, there are explicit advanced subpaths for those shapes:

- `@seo-solver/types/extract-advanced`
- `@seo-solver/types/compare-advanced`
- `@seo-solver/types/validate-advanced`

Those advanced subpaths are where envelopes, pipelines, validators, comparators, and similar low-level coordination types now live.

## Which path should you choose?

- Use the stable domain subpaths for public contracts.
- Use the `*-advanced` subpaths only when you are intentionally working with low-level package internals.

## Related docs and examples

- [docs/advanced.md](docs/advanced.md) — domain and advanced subpath examples
- [examples/subpath-imports.ts](examples/subpath-imports.ts) — minimal import examples
