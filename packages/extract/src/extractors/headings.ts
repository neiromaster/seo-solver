import type { ResourceType } from '@seo-solver/types';
import type { ExtractionEnvelope, HeadingsData } from '@seo-solver/types/extract';
import type { FetchResult } from '@seo-solver/types/fetch';
import { type ParsedDocument, parseHtml } from '../parse-html.js';
import { normalizeWhitespace } from '../utils/normalize.js';

export class HeadingsExtractor {
  readonly type = 'headings';
  readonly accepts: ResourceType[] = ['html'];

  extract(input: FetchResult): ExtractionEnvelope<HeadingsData> | null {
    if (input.resourceType !== 'html') {
      return null;
    }

    return this.extractFromDocument(parseHtml(input.body), input);
  }

  extractFromDocument(document: ParsedDocument, input: FetchResult): ExtractionEnvelope<HeadingsData> | null {
    const data: HeadingsData = [];
    const rawParts: string[] = [];

    for (const element of document('h1, h2, h3, h4, h5, h6').toArray()) {
      const node = document(element);
      const tagName = element.tagName.toLowerCase();
      const level = Number.parseInt(tagName.slice(1), 10);
      data.push({
        level,
        text: normalizeWhitespace(node.text()),
      });
      rawParts.push(document.html(element));
    }

    if (data.length === 0) {
      return null;
    }

    return {
      type: this.type,
      source: input.url,
      data,
      raw: rawParts.join(''),
    };
  }
}
