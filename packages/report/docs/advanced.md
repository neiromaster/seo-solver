# Advanced reporting

```ts
import { createReporter, filterDiagnosticsBySeverity, groupDiagnostics } from '@seo-solver/report/advanced';

const reporter = createReporter({ format: 'json', jsonPretty: true });
```

Use `@seo-solver/report/advanced` for reusable formatting config and shared reporting helpers. The root entrypoint is intentionally limited to one-off formatting and final status helpers.
