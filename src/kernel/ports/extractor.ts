import type { CapabilityId, ExtractedDocument, FetchedSource } from '#kernel/models';

export type Extractor<TData = unknown> = {
  readonly id: CapabilityId;
  readonly kind: string;

  canExtract(input: FetchedSource): boolean;
  extract(input: FetchedSource): Promise<ExtractedDocument<TData>>;
};
