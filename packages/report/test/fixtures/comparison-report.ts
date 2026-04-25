import type { ComparisonReport } from '@seo-solver/types/compare';

export const comparisonReportFixture: ComparisonReport = {
  comparisons: [
    {
      diffs: [
        {
          after: 'Final Title For Production Release',
          before: 'Draft Title That Was Used During Development Phase',
          kind: 'changed',
          path: 'og:title',
        },
        {
          after: 'Updated line with <final> and a much longer description to exercise truncation in normal mode',
          before: 'Line 1\nLine 2 with <draft>',
          kind: 'changed',
          path: 'og:description',
        },
        {
          after: 'article',
          kind: 'added',
          path: 'og:type',
        },
      ],
      sourceA: 'https://staging.example.com',
      sourceB: 'https://example.com',
      type: 'opengraph',
    },
    {
      diffs: [],
      sourceA: 'https://staging.example.com',
      sourceB: 'https://example.com',
      type: 'meta',
    },
    {
      diffs: [
        {
          after: {
            level: 3,
            text: 'Enterprise | Pro',
          },
          before: {
            level: 2,
            text: 'Enterprise',
          },
          kind: 'changed',
          path: '[1]',
        },
        {
          after: {
            level: 3,
            text: 'FAQ',
          },
          kind: 'added',
          path: '[2]',
        },
      ],
      sourceA: 'https://staging.example.com',
      sourceB: 'https://example.com',
      type: 'headings',
    },
    {
      diffs: [
        {
          before: {
            '@type': 'Product',
            name: 'Widget <script>',
          },
          kind: 'removed',
          path: '',
        },
      ],
      sourceA: 'https://staging.example.com',
      sourceB: 'https://example.com',
      type: 'jsonld',
    },
  ],
  fetchA: {
    statusCode: 200,
    timing: 234,
  },
  fetchB: {
    statusCode: 200,
    timing: 187,
  },
  timestamp: '2026-04-09T15:30:00Z',
  urlA: 'https://staging.example.com',
  urlB: 'https://example.com',
};
