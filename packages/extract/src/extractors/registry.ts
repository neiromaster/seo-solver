import type { Extractor, ExtractorPipelineConfig } from '@seo-solver/types/extract';
import { CanonicalExtractor } from './canonical.js';
import { HeadingsExtractor } from './headings.js';
import { JsonLdExtractor } from './jsonld.js';
import { MetaTagsExtractor } from './meta.js';
import { OpenGraphExtractor } from './opengraph.js';
import { RobotsTxtExtractor } from './robots-txt.js';

export type BuiltInExtractorId = 'opengraph' | 'jsonld' | 'meta' | 'headings' | 'canonical' | 'robots-txt';

export function createBuiltInExtractors(config: ExtractorPipelineConfig = {}): Record<BuiltInExtractorId, Extractor> {
  return {
    opengraph: new OpenGraphExtractor(),
    jsonld: new JsonLdExtractor({ onError: config.onError }),
    meta: new MetaTagsExtractor(),
    headings: new HeadingsExtractor(),
    canonical: new CanonicalExtractor(),
    'robots-txt': new RobotsTxtExtractor(),
  };
}

export function resolveExtractors(
  config: ExtractorPipelineConfig | undefined,
  requested: Array<string | Extractor> | undefined,
): Extractor[] {
  const registry = createBuiltInExtractors(config);
  const selected = requested ?? Object.keys(registry);

  return selected.map((entry) => {
    if (typeof entry !== 'string') {
      return entry;
    }

    const extractor = registry[entry as BuiltInExtractorId];
    if (!extractor) {
      throw new Error(`Unknown extractor: ${entry}`);
    }

    return extractor;
  });
}
