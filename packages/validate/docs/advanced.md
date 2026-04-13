# Advanced validation

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

Use the advanced surface for validator classes and explicit runtime JSON-LD configuration. Root `validatePage()` remains pure by default.
