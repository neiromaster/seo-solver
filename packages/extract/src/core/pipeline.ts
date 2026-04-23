import type {
  ExtractionEnvelope,
  ExtractorPipeline,
  ExtractorPipelineConfig,
} from '@seo-solver/types/extract-advanced';
import type { FetchResult } from '@seo-solver/types/fetch';
import { ExtractionError } from '../errors.js';
import { resolveExtractors } from './extractors/registry.js';
import { isHtmlExtractor } from './extractors/shared.js';
import * as parseHtmlModule from './parse-html.js';

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

function htmlToMinimalFetchResult(
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
