import type { ExtractionEnvelope, ExtractionWarning, Extractor, FetchResult } from '@seo-solver/types';
import type { ParsedDocument } from '../parse-html.js';

export type ExtractionErrorPolicy = 'skip' | 'throw' | 'include';

export type HtmlExtractor<T = unknown> = Extractor<T> & {
  extractFromDocument(
    document: ParsedDocument,
    input: FetchResult,
  ): ExtractionEnvelope<T> | ExtractionEnvelope<T>[] | null;
};

export function isHtmlExtractor(extractor: Extractor): extractor is HtmlExtractor {
  return 'extractFromDocument' in extractor;
}

export function ensureWarningList(warnings: ExtractionWarning[]): ExtractionWarning[] | undefined {
  return warnings.length > 0 ? warnings : undefined;
}
