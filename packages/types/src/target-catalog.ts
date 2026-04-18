import type { ResourceType } from './resource-type.js';

export type TargetKey = 'opengraph' | 'jsonld' | 'meta' | 'headings' | 'canonical' | 'robotsTxt';

export type TargetCatalogEntry = {
  id: string;
  key: TargetKey;
  resourceTypes: ResourceType[];
  description: string;
  defaultEnabled: boolean;
};
