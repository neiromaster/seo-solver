# @seo-solver/validate

`@seo-solver/validate` validates extracted SEO data. By default it stays pure and deterministic; runtime-enriched JSON-LD validation is available, but only when you opt into it explicitly.

## Installation

```bash
pnpm add @seo-solver/validate
```

The package already includes its JSON-LD runtime dependency. You only need to opt into that runtime path in code or through CLI flags when you actually want it.

## What this package gives you

- a simple `validatePage()` API for validating extracted page data
- a package-owned `listRules()` catalog
- strict `parseSeverityOverrides()` handling
- an advanced validator/pipeline surface for custom orchestration and runtime config

## Simple API

```ts
import { listRules, parseSeverityOverrides, validatePage } from '@seo-solver/validate';

const overrides = parseSeverityOverrides(['meta/description-missing=error']);
const report = await validatePage(page, {
  severityOverrides: overrides,
});

console.log(report.validations);
console.log(listRules());
```

This is the right API if you already have an extracted page and want a stable validation report. At page level, validation distinguishes between targets that were not requested, targets that were requested but missing, and targets that were extracted successfully.

## Advanced API

The application uses the advanced surface when it needs validator-level control or explicit runtime JSON-LD configuration.

```ts
import { createValidationPipeline, listRules } from '@seo-solver/validate/advanced';

const pipeline = createValidationPipeline({
  runtime: {
    jsonldAdobe: {
      enabled: true,
    },
  },
});

console.log(listRules());
```

Use `@seo-solver/validate/advanced` when you need validator classes, low-level pipeline control, or runtime-specific wiring. For most consumers, `validatePage()` should be the default choice.

## Rule selectors and overrides

Rule selectors are strict. If you pass an unknown rule id or wildcard prefix, the package treats it as an error instead of silently ignoring it. That makes it safer to automate around `disableRules` and `severityOverrides`.

## Presence-aware page validation

When you validate an `ExtractedPage`, the package uses page-level `targetStatus` metadata to distinguish three states:

- target not requested -> no diagnostics for that target
- target requested/default-selected but missing -> emit only `<target>/section-missing`
- target present -> run the normal target validators

This keeps missing sections visible without pretending they were extracted as empty payloads.

## Related docs and examples

- [docs/advanced.md](docs/advanced.md) — pipeline and runtime validation notes
- [examples/basic-validate.ts](examples/basic-validate.ts) — root API example
- [examples/advanced-pipeline.ts](examples/advanced-pipeline.ts) — advanced pipeline example
