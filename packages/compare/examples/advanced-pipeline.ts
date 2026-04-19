import { createComparisonPipeline } from '@seo-solver/compare/advanced';
import type { ExtractedPage } from '@seo-solver/types/extract';

declare const leftPage: ExtractedPage;
declare const rightPage: ExtractedPage;

const pipeline = createComparisonPipeline({ ignoreArrayOrder: true });
console.log(
  pipeline.compare(
    [
      ...(leftPage.data.canonical
        ? [{ type: 'canonical', source: leftPage.source.url, data: leftPage.data.canonical }]
        : []),
      ...(leftPage.data.meta ? [{ type: 'meta', source: leftPage.source.url, data: leftPage.data.meta }] : []),
    ],
    [
      ...(rightPage.data.canonical
        ? [{ type: 'canonical', source: rightPage.source.url, data: rightPage.data.canonical }]
        : []),
      ...(rightPage.data.meta ? [{ type: 'meta', source: rightPage.source.url, data: rightPage.data.meta }] : []),
    ],
  ),
);
