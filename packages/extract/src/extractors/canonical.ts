import type { ResourceType } from '@seo-solver/types';
import type { CanonicalData } from '@seo-solver/types/extract';
import type { ExtractionEnvelope, ExtractionWarning } from '@seo-solver/types/extract-advanced';
import type { FetchResult } from '@seo-solver/types/fetch';
import { type ParsedDocument, parseHtml } from '../parse-html';

export class CanonicalExtractor {
  readonly type = 'canonical';
  readonly accepts: ResourceType[] = ['html'];

  extract(input: FetchResult): ExtractionEnvelope<CanonicalData> | null {
    if (input.resourceType !== 'html') {
      return null;
    }

    return this.extractFromDocument(parseHtml(input.body), input);
  }

  extractFromDocument(document: ParsedDocument, input: FetchResult): ExtractionEnvelope<CanonicalData> | null {
    const warnings: ExtractionWarning[] = [];
    const canonicalNodes = document('link')
      .toArray()
      .filter((element) => hasRelToken(document(element).attr('rel'), 'canonical'));
    const alternateNodes = document('link')
      .toArray()
      .filter((element) => hasRelToken(document(element).attr('rel'), 'alternate'));

    if (canonicalNodes.length > 1) {
      warnings.push({ message: 'Multiple canonical links found', location: 'link[rel="canonical"]' });
    }

    const canonical = canonicalNodes.length > 0 ? (document(canonicalNodes[0]).attr('href') ?? null) : null;
    const hreflang = alternateNodes
      .map((element) => {
        const node = document(element);
        const lang = node.attr('hreflang');
        const href = node.attr('href');
        if (!lang || href === undefined) {
          return null;
        }

        return { lang, href };
      })
      .filter(
        (entry: { lang: string; href: string } | null): entry is { lang: string; href: string } => entry !== null,
      );

    const rawNodes = [...canonicalNodes, ...alternateNodes.filter((element) => document(element).attr('hreflang'))];

    if (canonical === null && hreflang.length === 0 && warnings.length === 0) {
      return null;
    }

    return {
      type: this.type,
      source: input.url,
      data: {
        canonical,
        hreflang,
      },
      raw: rawNodes.map((element) => document.html(element)).join('') || undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
}

function hasRelToken(rel: string | undefined, token: string): boolean {
  if (!rel) {
    return false;
  }

  return rel
    .split(/\s+/)
    .map((part) => part.toLowerCase())
    .includes(token);
}
