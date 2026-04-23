import type { TargetKey } from '@seo-solver/types/extract';
import type { Extractor, ExtractorPipelineConfig } from '@seo-solver/types/extract-advanced';
import { CanonicalExtractor } from '../../seo/extractors/canonical.js';
import { HeadingsExtractor } from '../../seo/extractors/headings.js';
import { JsonLdExtractor } from '../../seo/extractors/jsonld.js';
import { MetaTagsExtractor } from '../../seo/extractors/meta.js';
import { OpenGraphExtractor } from '../../seo/extractors/opengraph.js';
import { RobotsTxtExtractor } from '../../seo/extractors/robots-txt.js';
import { resolveTargetId } from '../catalog.js';

export type BuiltInExtractorId = 'opengraph' | 'jsonld' | 'meta' | 'headings' | 'canonical' | 'robots-txt';

export function createBuiltInExtractors(config: ExtractorPipelineConfig = {}): Record<BuiltInExtractorId, Extractor> {
  return {
    opengraph: new OpenGraphExtractor(),
    jsonld: new JsonLdExtractor({
      onError: config.onError === 'report' ? 'include' : config.onError === 'ignore' ? 'skip' : config.onError,
    }),
    meta: new MetaTagsExtractor(),
    headings: new HeadingsExtractor(),
    canonical: new CanonicalExtractor(),
    'robots-txt': new RobotsTxtExtractor(),
  };
}

export function resolveExtractors(
  config: ExtractorPipelineConfig | undefined,
  requested: Array<TargetKey | Extractor> | undefined,
): Extractor[] {
  const registry = createBuiltInExtractors(config);
  const selected = requested ?? Object.keys(registry);

  return selected.map((entry) => {
    if (typeof entry !== 'string') {
      return entry;
    }

    const id = entry.includes('-') ? entry : resolveTargetId(entry as TargetKey);
    const extractor = registry[id as BuiltInExtractorId];
    if (!extractor) {
      throw new Error(`Unknown extractor: ${entry}`);
    }

    return extractor;
  });
}
