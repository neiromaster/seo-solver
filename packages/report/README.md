# @seo-solver/report

`@seo-solver/report` turns comparison and validation results into user-facing output. It also owns the status helpers that answer questions like “did validation fail?” and “does this comparison contain diffs?”

## Installation

```bash
pnpm add @seo-solver/report
```

## What this package gives you

- simple top-level helpers like `formatValidationReport()` and `formatComparisonReport()`
- status helpers like `hasFailed()` and `hasDiffs()`
- reusable reporter construction for apps and CLIs
- terminal, json, markdown, and html output support

## Simple API

```ts
import {
  formatComparisonReport,
  formatValidationReport,
  hasDiffs,
  hasFailed,
} from '@seo-solver/report';

const validationOutput = formatValidationReport(validationReport, { format: 'json' });
const comparisonOutput = formatComparisonReport(comparisonReport, { format: 'markdown' });
```

If you just want formatted output or final status checks, the root API is enough.

## Advanced API

The application uses `createReporter()` when it wants to resolve formatting config once and reuse it across commands.

```ts
import { createReporter, filterDiagnosticsBySeverity, groupDiagnostics } from '@seo-solver/report';

const reporter = createReporter({ format: 'json', jsonPretty: true });

console.log(reporter.formatValidationReport(validationReport));
```

Use the reusable reporter form when you want one configured formatter for many calls rather than one-off formatting helpers.

## Related docs and examples

- [docs/advanced.md](docs/advanced.md) — reusable reporter configuration
- [examples/basic-reporting.ts](examples/basic-reporting.ts) — root helper usage
