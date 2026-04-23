# Advanced fetch usage

```ts
import { createSharedRetryExecutor, registerBackend, registerNativeBackend, resolveBackend } from '@seo-solver/fetch/advanced';
```

The advanced surface owns backend registry wiring and shared retry execution. Call `registerNativeBackend()` explicitly before resolving the built-in native backend.
