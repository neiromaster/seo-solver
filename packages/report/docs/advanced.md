# Advanced reporting

```ts
import { createReporter, filterDiagnosticsBySeverity, groupDiagnostics } from '@seo-solver/report';

const reporter = createReporter({ format: 'json', jsonPretty: true });
```

Use `createReporter()` for reusable formatting config. Use the root formatting helpers for the simplest task API.
