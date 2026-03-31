import type { CapabilityId, FetchedSource, SourceRef } from '#kernel/models';

export type Fetcher = {
  readonly id: CapabilityId;
  fetch(source: SourceRef): Promise<FetchedSource>;
};
