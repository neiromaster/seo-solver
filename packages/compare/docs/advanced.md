# Advanced comparison

```ts
import { createComparisonPipeline, diff, GenericComparator, HeadingsComparator } from '@seo-solver/compare/advanced';

const pipeline = createComparisonPipeline({ ignoreArrayOrder: true });
```

Use the advanced surface for comparator injection and direct diff helpers. Use `comparePages()` for the simple task API.
