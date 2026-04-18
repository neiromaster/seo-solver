import type { ExtractionEnvelope } from './extraction-envelope.js';
import type { FetchResult } from './fetch-result.js';
import type { ResourceType } from './resource-type.js';

export type Extractor<T = unknown> = {
  readonly type: string;
  readonly accepts: ResourceType[];
  extract(input: FetchResult): ExtractionEnvelope<T> | ExtractionEnvelope<T>[] | null;
};
