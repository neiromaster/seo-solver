import type { ResourceType } from '@seo-solver/types';
import type { JsonLdData, JsonLdEntry } from '@seo-solver/types/extract';
import type { ExtractionEnvelope, ExtractionWarning } from '@seo-solver/types/extract-advanced';
import type { FetchResult } from '@seo-solver/types/fetch';
import { ExtractionError } from '../errors.js';
import { type ParsedDocument, parseHtml } from '../parse-html.js';
import type { ExtractionErrorPolicy } from './shared.js';

export type JsonLdExtractorOptions = {
  onError?: ExtractionErrorPolicy | undefined;
};

export class JsonLdExtractor {
  readonly type = 'jsonld';
  readonly accepts: ResourceType[] = ['html'];
  readonly #onError: ExtractionErrorPolicy;

  constructor(options: JsonLdExtractorOptions = {}) {
    this.#onError = options.onError ?? 'skip';
  }

  extract(input: FetchResult): ExtractionEnvelope<JsonLdData | null> | null {
    if (input.resourceType !== 'html') {
      return null;
    }

    return this.extractFromDocument(parseHtml(input.body), input);
  }

  extractFromDocument(document: ParsedDocument, input: FetchResult): ExtractionEnvelope<JsonLdData | null> | null {
    const scripts = document('script[type="application/ld+json"]');
    if (scripts.length === 0) {
      return null;
    }

    const data: JsonLdEntry[] = [];
    const warnings: ExtractionWarning[] = [];
    const rawParts: string[] = [];

    scripts.toArray().forEach((element, index) => {
      const node = document(element);
      rawParts.push(document.html(element));

      const rawContent = decodeHtmlEntities(node.html() ?? node.text());
      if (rawContent.trim() === '') {
        handleInvalidJsonLd({
          onError: this.#onError,
          warnings,
          location: `script[${index}]`,
          reason: 'Empty JSON-LD block',
          extractorType: this.type,
        });
        return;
      }

      try {
        const parsed = JSON.parse(rawContent) as unknown;
        data.push(...normalizeJsonLdEntry(parsed));
      } catch (error) {
        handleInvalidJsonLd({
          onError: this.#onError,
          warnings,
          location: `script[${index}]`,
          reason: 'Invalid JSON-LD block',
          extractorType: this.type,
          cause: error,
        });
      }
    });

    if (data.length === 0 && warnings.length === 0) {
      return null;
    }

    if (data.length === 0 && this.#onError === 'include') {
      return {
        type: this.type,
        source: input.url,
        data: null,
        raw: rawParts.join(''),
        warnings,
      };
    }

    return {
      type: this.type,
      source: input.url,
      data,
      raw: rawParts.join(''),
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
}

function normalizeJsonLdEntry(parsed: unknown): JsonLdEntry[] {
  return isJsonLdEntry(parsed) ? [parsed] : [];
}

function isJsonLdEntry(value: unknown): value is JsonLdEntry {
  return Array.isArray(value) || (typeof value === 'object' && value !== null);
}

function decodeHtmlEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    const normalizedEntity = entity.toLowerCase();
    if (normalizedEntity[0] === '#') {
      const isHex = normalizedEntity[1] === 'x';
      const rawCodePoint = isHex ? normalizedEntity.slice(2) : normalizedEntity.slice(1);
      const codePoint = Number.parseInt(rawCodePoint, isHex ? 16 : 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }

    const decodedNamedEntity = NAMED_HTML_ENTITIES[normalizedEntity];
    return decodedNamedEntity ?? match;
  });
}

const NAMED_HTML_ENTITIES: Record<string, string> = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  quot: '"',
};

function handleInvalidJsonLd({
  onError,
  warnings,
  location,
  reason,
  extractorType,
  cause,
}: {
  onError: ExtractionErrorPolicy;
  warnings: ExtractionWarning[];
  location: string;
  reason: string;
  extractorType: string;
  cause?: unknown;
}): void {
  if (onError === 'throw') {
    throw new ExtractionError(reason, extractorType, cause instanceof Error ? { cause } : undefined);
  }

  warnings.push({ message: reason, location });
}
