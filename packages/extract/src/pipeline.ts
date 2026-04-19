import type { ExtractedPage, ExtractHtmlOptions, ExtractPageOptions } from '@seo-solver/types/extract';
import type {
  ExtractionEnvelope,
  ExtractorPipeline,
  ExtractorPipelineConfig,
} from '@seo-solver/types/extract-advanced';
import type { FetchResult } from '@seo-solver/types/fetch';
import { listTargets } from './catalog.js';
import { ExtractionError } from './errors.js';
import { CanonicalExtractor } from './extractors/canonical.js';
import { HeadingsExtractor } from './extractors/headings.js';
import { JsonLdExtractor } from './extractors/jsonld.js';
import { MetaTagsExtractor } from './extractors/meta.js';
import { OpenGraphExtractor } from './extractors/opengraph.js';
import { resolveExtractors } from './extractors/registry.js';
import { isHtmlExtractor } from './extractors/shared.js';
import * as parseHtmlModule from './parse-html.js';
import { toExtractedPage } from './result.js';

export function createExtractorPipeline(config: ExtractorPipelineConfig = {}): ExtractorPipeline {
  const configuredExtractors = resolveExtractors(config, config.targets);

  return {
    extract(input, options) {
      const selectedExtractors = resolveExtractors(config, options?.targets ?? configuredExtractors);
      const matchingExtractors = selectedExtractors.filter((extractor) =>
        extractor.accepts.includes(input.resourceType),
      );
      if (matchingExtractors.length === 0) {
        return [];
      }

      const envelopes: ExtractionEnvelope[] = [];
      const htmlExtractors = input.resourceType === 'html' ? matchingExtractors.filter(isHtmlExtractor) : [];
      const parsedDocument = htmlExtractors.length > 0 ? parseHtmlModule.parseHtml(input.body) : null;

      for (const extractor of matchingExtractors) {
        try {
          const result =
            parsedDocument && isHtmlExtractor(extractor)
              ? extractor.extractFromDocument(parsedDocument, input)
              : extractor.extract(input);
          if (result === null) {
            continue;
          }

          if (Array.isArray(result)) {
            envelopes.push(...result);
          } else {
            envelopes.push(result);
          }
        } catch (error) {
          if (config.onError === 'throw') {
            throw error instanceof ExtractionError
              ? error
              : new ExtractionError(
                  getErrorMessage(error),
                  extractor.type,
                  error instanceof Error ? { cause: error } : undefined,
                );
          }

          if (config.onError === 'report') {
            envelopes.push({
              type: extractor.type,
              source: input.url,
              data: null,
              warnings: [{ message: getErrorMessage(error) }],
            });
          }
        }
      }

      return envelopes;
    },
    get extractors() {
      return configuredExtractors;
    },
  };
}

export function extractAll(html: string): ExtractionEnvelope[] {
  return createExtractorPipeline({
    targets: ['opengraph', 'jsonld', 'meta', 'headings', 'canonical'],
  }).extract(htmlToMinimalFetchResult(html, 'html'));
}

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

export function extractOpenGraph(html: string) {
  return new OpenGraphExtractor().extract(htmlToMinimalFetchResult(html, 'html'))?.data ?? null;
}

export function extractJsonLd(html: string) {
  return new JsonLdExtractor().extract(htmlToMinimalFetchResult(html, 'html'))?.data ?? null;
}

export function extractMetaTags(html: string) {
  return new MetaTagsExtractor().extract(htmlToMinimalFetchResult(html, 'html'))?.data ?? null;
}

export function extractHeadings(html: string) {
  return new HeadingsExtractor().extract(htmlToMinimalFetchResult(html, 'html'))?.data ?? null;
}

export function extractCanonical(html: string) {
  return new CanonicalExtractor().extract(htmlToMinimalFetchResult(html, 'html'))?.data ?? null;
}

export function extractRobotsText(text: string, options: { url?: string } = {}): ExtractedPage {
  return extractPage(htmlToMinimalFetchResult(text, 'robots-txt', options.url, 200), { targets: ['robotsTxt'] });
}

export function htmlToMinimalFetchResult(
  body: string,
  resourceType: FetchResult['resourceType'],
  url = 'about:blank',
  statusCode = 200,
): FetchResult {
  return {
    requestUrl: url,
    url,
    statusCode,
    headers: {},
    body,
    resourceType,
    redirects: [],
    timing: 0,
    attempts: 1,
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function defaultTargetsForResourceType(resourceType: FetchResult['resourceType']) {
  return listTargets()
    .filter((entry) => entry.defaultEnabled && entry.resourceTypes.includes(resourceType))
    .map((entry) => entry.key);
}
