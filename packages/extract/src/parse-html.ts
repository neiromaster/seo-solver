import { type CheerioAPI, load } from 'cheerio';

export type ParsedDocument = CheerioAPI;

export function parseHtml(html: string): ParsedDocument {
  return load(html);
}
