import type { ExtractionEnvelope } from './extraction-envelope';
import type { FetchResult } from './fetch-result';
import type { ResourceType } from './resource-type';

export type Extractor<T = unknown> = {
  readonly type: string;
  readonly accepts: ResourceType[];
  extract(input: FetchResult): ExtractionEnvelope<T> | ExtractionEnvelope<T>[] | null;
};
