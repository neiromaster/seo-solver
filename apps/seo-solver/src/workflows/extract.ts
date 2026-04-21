import { extractPage } from '@seo-solver/extract';
import type { ExtractedPage, TargetKey } from '@seo-solver/types/extract';
import type { Fetcher, FetchResult } from '@seo-solver/types/fetch';

export type ExtractOptions = {
  targets?: TargetKey[] | undefined;
};

export type ExtractResult = {
  fetchResult: FetchResult;
  page: ExtractedPage;
};

export async function runExtract(fetcher: Fetcher, url: string, options: ExtractOptions = {}): Promise<ExtractResult> {
  const fetchResult = await fetcher.fetch(url);
  const page = extractPage(fetchResult, options.targets === undefined ? {} : { targets: options.targets });

  return { fetchResult, page };
}
