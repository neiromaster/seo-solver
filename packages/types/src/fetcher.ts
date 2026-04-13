import type { FetchOptions } from './fetch-options';
import type { FetchResult } from './fetch-result';

export type Fetcher = {
  readonly name: string;
  fetch(url: string, options?: FetchOptions): Promise<FetchResult>;
  dispose(): Promise<void>;
};
