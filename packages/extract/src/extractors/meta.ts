import type { ExtractionEnvelope, FetchResult, MetaTagsData, ResourceType } from '@seo-solver/types';
import { type ParsedDocument, parseHtml } from '../parse-html.js';
import { normalizeWhitespace } from '../utils/normalize.js';

const OPEN_GRAPH_PREFIXES = ['og:', 'article:', 'book:', 'music:', 'video:', 'profile:'];

export class MetaTagsExtractor {
  readonly type = 'meta';
  readonly accepts: ResourceType[] = ['html'];

  extract(input: FetchResult): ExtractionEnvelope<MetaTagsData> | null {
    if (input.resourceType !== 'html') {
      return null;
    }

    return this.extractFromDocument(parseHtml(input.body), input);
  }

  extractFromDocument(document: ParsedDocument, input: FetchResult): ExtractionEnvelope<MetaTagsData> | null {
    const data: MetaTagsData = {
      title: null,
      charset: null,
      name: {},
      httpEquiv: {},
    };

    const title = document('title').first();
    if (title.length > 0) {
      data.title = normalizeWhitespace(title.text());
    }

    const charset = document('meta[charset]').first().attr('charset');
    if (charset !== undefined) {
      data.charset = charset;
    }

    for (const element of document('meta').toArray()) {
      const node = document(element);
      const name = node.attr('name');
      const httpEquiv = node.attr('http-equiv');
      const content = node.attr('content');

      if (name && content !== undefined && !isOpenGraphLikeName(name)) {
        data.name[name.toLowerCase()] = content;
      }

      if (httpEquiv && content !== undefined) {
        data.httpEquiv[httpEquiv.toLowerCase()] = content;
      }
    }

    if (data.title === null && data.charset === null && isRecordEmpty(data.name) && isRecordEmpty(data.httpEquiv)) {
      return null;
    }

    return {
      type: this.type,
      source: input.url,
      data,
      raw:
        [
          title.length > 0 ? document.html(title) : '',
          document('meta')
            .toArray()
            .map((element) => document.html(element))
            .join(''),
        ]
          .join('')
          .trim() || undefined,
    };
  }
}

function isOpenGraphLikeName(value: string): boolean {
  const normalizedValue = value.toLowerCase();
  return OPEN_GRAPH_PREFIXES.some((prefix) => normalizedValue.startsWith(prefix));
}

function isRecordEmpty(value: Record<string, string>): boolean {
  return Object.keys(value).length === 0;
}
