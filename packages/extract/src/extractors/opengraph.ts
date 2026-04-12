import type { ResourceType } from '@seo-solver/types';
import type { ExtractionEnvelope, OpenGraphData } from '@seo-solver/types/extract';
import type { FetchResult } from '@seo-solver/types/fetch';
import { type ParsedDocument, parseHtml } from '../parse-html.js';
import { ensureWarningList } from './shared.js';

const OPEN_GRAPH_PREFIXES = ['og:', 'article:', 'book:', 'music:', 'video:', 'profile:', 'al:', 'vk:'];

export class OpenGraphExtractor {
  readonly type = 'opengraph';
  readonly accepts: ResourceType[] = ['html'];

  extract(input: FetchResult): ExtractionEnvelope<OpenGraphData> | null {
    if (input.resourceType !== 'html') {
      return null;
    }

    return this.extractFromDocument(parseHtml(input.body), input);
  }

  extractFromDocument(document: ParsedDocument, input: FetchResult): ExtractionEnvelope<OpenGraphData> | null {
    const entries = new Map<string, string | string[]>();
    const rawParts: string[] = [];

    for (const element of document('meta').toArray()) {
      const node = document(element);
      const property = node.attr('property');
      const name = node.attr('name');
      const key = selectOpenGraphKey(property, name);
      if (!key) {
        continue;
      }

      const content = node.attr('content');
      if (content === undefined) {
        continue;
      }

      rawParts.push(document.html(element));
      const existing = entries.get(key);
      if (existing === undefined) {
        entries.set(key, content);
        continue;
      }

      if (Array.isArray(existing)) {
        existing.push(content);
        continue;
      }

      entries.set(key, [existing, content]);
    }

    if (entries.size === 0) {
      return null;
    }

    return {
      type: this.type,
      source: input.url,
      data: Object.fromEntries(entries),
      raw: rawParts.join(''),
      warnings: ensureWarningList([]),
    };
  }
}

function selectOpenGraphKey(property: string | undefined, name: string | undefined): string | null {
  if (property && isOpenGraphKey(property)) {
    return property;
  }

  if (name && isOpenGraphKey(name)) {
    return name;
  }

  return null;
}

function isOpenGraphKey(value: string): boolean {
  return OPEN_GRAPH_PREFIXES.some((prefix) => value.startsWith(prefix));
}
