import type { ExtractedPage } from '@seo-solver/types/extract';
import { createValidationPipeline, validatePageAdvanced } from '@seo-solver/validate/advanced';

declare const page: ExtractedPage;

const pipeline = createValidationPipeline({
  runtime: {
    jsonldAdobe: {
      enabled: true,
    },
  },
});

console.log(
  await pipeline.validate([
    ...(page.data.canonical ? [{ type: 'canonical', source: page.source.url, data: page.data.canonical }] : []),
    ...(page.data.jsonld ? [{ type: 'jsonld', source: page.source.url, data: page.data.jsonld }] : []),
    ...(page.data.meta ? [{ type: 'meta', source: page.source.url, data: page.data.meta }] : []),
  ]),
);

console.log(
  await validatePageAdvanced(page, {
    validators: ['meta', 'jsonld'],
    runtime: {
      jsonldAdobe: {
        enabled: true,
      },
    },
  }),
);
