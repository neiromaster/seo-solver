import type {
  ExtractionEnvelope,
  Extractor,
  ExtractorPipeline,
  ExtractorPipelineConfig,
  FetchResult,
} from '@seo-solver/types';
import { ExtractionError } from './errors.js';
import { CanonicalExtractor } from './extractors/canonical.js';
import { HeadingsExtractor } from './extractors/headings.js';
import { JsonLdExtractor } from './extractors/jsonld.js';
import { MetaTagsExtractor } from './extractors/meta.js';
import { OpenGraphExtractor } from './extractors/opengraph.js';
import { resolveExtractors } from './extractors/registry.js';
import { isHtmlExtractor } from './extractors/shared.js';
import * as parseHtmlModule from './parse-html.js';

export function createExtractorPipeline(config: ExtractorPipelineConfig = {}): ExtractorPipeline {
  const configuredExtractors = resolveExtractors(config, config.extractors);

  return {
    extract(input, options) {
      const selectedExtractors = resolveExtractors(config, options?.extractors ?? configuredExtractors);
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

          if (config.onError === 'include') {
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
    extractors: ['opengraph', 'jsonld', 'meta', 'headings', 'canonical'],
  }).extract(htmlToMinimalFetchResult(html, 'html'));
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

export function htmlToMinimalFetchResult(body: string, resourceType: FetchResult['resourceType']): FetchResult {
  return {
    requestUrl: '',
    url: '',
    statusCode: 200,
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
