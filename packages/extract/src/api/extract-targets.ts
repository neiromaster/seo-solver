import { CanonicalExtractor } from '../seo/extractors/canonical.js';
import { HeadingsExtractor } from '../seo/extractors/headings.js';
import { JsonLdExtractor } from '../seo/extractors/jsonld.js';
import { MetaTagsExtractor } from '../seo/extractors/meta.js';
import { OpenGraphExtractor } from '../seo/extractors/opengraph.js';
import { htmlToMinimalFetchResult } from './html-input.js';

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
