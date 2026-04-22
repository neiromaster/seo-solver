import { compareObjects } from '@seo-solver/compare';

const result = compareObjects(
  { title: 'Old title', meta: { description: 'Before' } },
  { title: 'New title', meta: { description: 'After' } },
);

console.log(result.diffs);
