import type { TargetCatalogEntry, TargetKey } from '@seo-solver/types/extract';

const TARGETS: readonly TargetCatalogEntry[] = [
  {
    id: 'canonical',
    key: 'canonical',
    resourceTypes: ['html'],
    description: 'Extract canonical URL and hreflang metadata',
    defaultEnabled: true,
  },
  {
    id: 'headings',
    key: 'headings',
    resourceTypes: ['html'],
    description: 'Extract heading hierarchy from the document',
    defaultEnabled: true,
  },
  {
    id: 'jsonld',
    key: 'jsonld',
    resourceTypes: ['html'],
    description: 'Extract JSON-LD structured data blocks',
    defaultEnabled: true,
  },
  {
    id: 'meta',
    key: 'meta',
    resourceTypes: ['html'],
    description: 'Extract meta tags including title and description',
    defaultEnabled: true,
  },
  {
    id: 'opengraph',
    key: 'opengraph',
    resourceTypes: ['html'],
    description: 'Extract Open Graph social metadata',
    defaultEnabled: true,
  },
  {
    id: 'robots-txt',
    key: 'robotsTxt',
    resourceTypes: ['robots-txt'],
    description: 'Extract robots.txt directives and sitemap entries',
    defaultEnabled: true,
  },
];

const TARGET_KEY_TO_ID: Record<TargetKey, string> = Object.fromEntries(
  TARGETS.map((entry) => [entry.key, entry.id]),
) as Record<TargetKey, string>;

export function listTargets(): readonly TargetCatalogEntry[] {
  return TARGETS;
}

export function resolveTargetId(key: TargetKey): string {
  return TARGET_KEY_TO_ID[key];
}
