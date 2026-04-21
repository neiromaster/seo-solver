# Advanced Playwright fetch usage

```ts
import { createFetcher } from '@seo-solver/fetch-playwright';

const fetcher = createFetcher();
const result = await fetcher.fetch('https://example.com');
await fetcher.dispose();
```
