import type { ExtractedPage, ExtractHtmlOptions, ExtractPageOptions } from '@seo-solver/types/extract';
import type { FetchResult } from '@seo-solver/types/fetch';
import { listTargets } from '../core/catalog.js';
import { createExtractorPipeline } from '../core/pipeline.js';
import { toExtractedPage } from '../core/result.js';
import { htmlToMinimalFetchResult } from './html-input.js';

export function extractPage(input: FetchResult, options: ExtractPageOptions = {}): ExtractedPage {
  const targets = options.targets ?? defaultTargetsForResourceType(input.resourceType);
  const pipeline = createExtractorPipeline({
    targets,
    onError: options.onError,
  });

  return toExtractedPage(input, pipeline.extract(input), targets);
}

export function extractHtml(html: string, options: ExtractHtmlOptions = {}): ExtractedPage {
  const fetchResult = htmlToMinimalFetchResult(html, 'html', options.url, options.statusCode ?? 200);
  return extractPage(fetchResult, options);
}

export function extractRobotsText(text: string, options: { url?: string } = {}): ExtractedPage {
  return extractPage(htmlToMinimalFetchResult(text, 'robots-txt', options.url, 200), { targets: ['robotsTxt'] });
}

function defaultTargetsForResourceType(resourceType: FetchResult['resourceType']) {
  return listTargets()
    .filter((entry) => entry.defaultEnabled && entry.resourceTypes.includes(resourceType))
    .map((entry) => entry.key);
}
