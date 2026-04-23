# Advanced extraction

Use the advanced API when you need pipeline construction or custom extractor instances. Use the root package for simple helpers like `extractMetaTags()` or `extractJsonLd()`.

```ts
import { listTargets } from '@seo-solver/extract';
import { createExtractorPipeline } from '@seo-solver/extract/advanced';

const targets = listTargets().map((entry) => entry.key);
const pipeline = createExtractorPipeline({ targets: ['meta', 'opengraph'] });
```

The advanced pipeline returns raw `ExtractionEnvelope[]`. The simple Level 1 API returns package-owned `ExtractedPage` results.
