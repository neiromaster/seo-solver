# @seo-solver/validate

`@seo-solver/validate` validates extracted SEO data. By default it stays pure and deterministic; runtime-enriched JSON-LD validation is available, but only when you opt into it explicitly.

## Installation

```bash
pnpm add @seo-solver/validate
```

The package already includes its JSON-LD runtime dependency. You only need to opt into that runtime path in code or through CLI flags when you actually want it.

## What this package gives you

- direct helper functions for validating data you already have, like `validateJsonLd()` and `validateOpenGraph()`
- a simple built-in `validatePage()` API for validating extracted page data
- a package-owned `listRules()` catalog
- strict `parseSeverityOverrides()` handling
- an advanced validator/pipeline surface for custom orchestration and runtime config

## Simple API

```ts
import type { ExtractedPage } from '@seo-solver/types/extract';
import { parseSeverityOverrides, validateJsonLd, validateMetaTags, validatePage } from '@seo-solver/validate';

const page = {} as ExtractedPage;

const diagnostics = await validateJsonLd(
  [{ '@type': 'Article' }],
  {
    runtime: {
      jsonldAdobe: {
        enabled: true,
      },
    },
  },
);

const metaDiagnostics = await validateMetaTags(
  {
    title: 'Example page title',
    charset: 'utf-8',
    name: {},
    httpEquiv: {},
    lang: null,
    itemprop: {},
  },
  {
    disableRules: ['meta/viewport-missing'],
    severityOverrides: parseSeverityOverrides(['meta/description-missing=error']),
  },
);

const pageReport = await validatePage(page, {
  disableRules: ['meta/viewport-missing'],
  severityOverrides: parseSeverityOverrides(['meta/description-missing=error']),
});

console.log(diagnostics);
console.log(metaDiagnostics);
console.log(pageReport);
```

Direct helpers return `Diagnostic[]` and do not require callers to build an `ExtractedPage` or an extraction envelope. Use them when your application already has SEO data from another source.

Available direct helpers:

- `validateCanonical(data, options?)`
- `validateHeadings(data, options?)`
- `validateJsonLd(data, options?)`
- `validateMetaTags(data, options?)`
- `validateOpenGraph(data, options?)`
- `validateRobotsTxt(data, options?)`
- `validateTwitterCards(data, options?)`

All helpers accept rule options, and `validateJsonLd()` additionally accepts JSON-LD runtime options:

```ts
type ValidateRuleOptions = {
  disableRules?: string[];
  severityOverrides?: Record<string, 'error' | 'warning' | 'info'>;
};

type ValidateDataOptions = ValidateRuleOptions;

type ValidateJsonLdOptions = ValidateRuleOptions & {
  runtime?: {
    jsonldAdobe?: {
      enabled?: boolean;
      cacheFile?: string | null;
      refreshTtlMs?: number;
      schemaUrl?: string;
    };
  };
};
```

`runtime` is intentionally available only on `validateJsonLd()` options.

Use `validatePage(page, options?)` if you already have an extracted page and want a stable built-in validation report without pipeline-level customization. At page level, validation distinguishes between targets that were not requested, targets that were requested but missing, and targets that were extracted successfully.

## Advanced API

The application uses the advanced surface when it needs validator-level control, explicit page-validation orchestration, or runtime JSON-LD configuration.

```ts
import { createValidationPipeline, listRules, validatePageAdvanced } from '@seo-solver/validate/advanced';

const pipeline = createValidationPipeline({
  runtime: {
    jsonldAdobe: {
      enabled: true,
    },
  },
});

const report = await validatePageAdvanced(page, {
  validators: ['meta', 'jsonld'],
  runtime: {
    jsonldAdobe: {
      enabled: true,
    },
  },
});

console.log(listRules());
console.log(report);
```

Use `@seo-solver/validate/advanced` when you need validator classes, low-level pipeline control, advanced page-validation control, or runtime-specific wiring. For most consumers, the root `validatePage()` should stay the default choice.

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
