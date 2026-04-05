import type { Comparator, Extractor, Fetcher, Renderer, Validator } from '#kernel/ports';

export type ExtractorBundle = {
  id: string;
  extractor: Extractor;
  comparator?: Comparator;
  validators: Validator[];
};

export type CapabilityRegistry = {
  fetchers: Map<string, Fetcher>;
  extractors: Map<string, ExtractorBundle>;
  renderers: Map<string, Renderer>;
};

export function createCapabilityRegistry(): CapabilityRegistry {
  return {
    fetchers: new Map(),
    extractors: new Map(),
    renderers: new Map(),
  };
}
