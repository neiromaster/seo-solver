import type { ValidationReport } from '@seo-solver/types/validate';

export const validationReportFixture: ValidationReport = {
  fetch: {
    redirects: [[301, 'http://example.com/page']],
    statusCode: 200,
    timing: 342,
  },
  timestamp: '2026-04-09T15:30:00Z',
  url: 'https://example.com/page',
  validations: [
    {
      diagnostics: [
        {
          message: 'og:title is required for social sharing',
          path: 'og:title',
          rule: 'og/title-missing',
          severity: 'error',
        },
        {
          actual:
            'Line 1 with <script>alert("x")</script>\nLine 2 that is intentionally very long so truncation becomes visible in normal formatter output.',
          expected: '≤ 200',
          message: 'og:description exceeds 200 characters (actual: 121)',
          path: 'og:description',
          rule: 'og/description-too-long',
          severity: 'warning',
        },
      ],
      source: 'https://example.com/page',
      type: 'opengraph',
    },
    {
      diagnostics: [
        {
          actual: 'A Very Long Page Title That Exceeds Recommended Limits For Search Results',
          expected: '≤ 60',
          message: 'Title exceeds 60 characters (actual: 71)',
          path: 'title',
          rule: 'meta/title-too-long',
          severity: 'warning',
        },
      ],
      source: 'https://example.com/page',
      type: 'meta',
    },
    {
      diagnostics: [],
      source: 'https://example.com/page',
      type: 'headings',
    },
    {
      diagnostics: [
        {
          actual: 'https://example.com/other?<tag>',
          expected: 'https://example.com/page',
          message: 'Canonical URL does not match og:url',
          path: 'canonical',
          rule: 'canonical/mismatch-og-url',
          severity: 'warning',
        },
      ],
      source: 'https://example.com/page',
      type: 'canonical',
    },
  ],
};
