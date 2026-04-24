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

Use the advanced surface for validator classes, explicit page-validation orchestration, and runtime JSON-LD configuration. Root `validatePage()` remains the simpler built-in page validator.
