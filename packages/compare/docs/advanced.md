# Advanced comparison

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

Use the advanced surface for extracted-page comparison, comparator injection, and direct diff helpers. Use the root package for generic object comparison.
