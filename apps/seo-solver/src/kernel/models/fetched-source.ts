import type { SourceRef } from './source-ref';

export type FetchedSource = {
  source: SourceRef;
  finalUrl: string;
  statusCode?: number;
  contentType?: string;
  body: string;
  headers: Record<string, string>;
  meta: Record<string, unknown>;
};
