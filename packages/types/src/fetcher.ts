import type { FetchOptions } from './fetch-options.js';
import type { FetchResult } from './fetch-result.js';

export type Fetcher = {
  readonly name: string;
  fetch(url: string, options?: FetchOptions): Promise<FetchResult>;
  dispose(): Promise<void>;
};
