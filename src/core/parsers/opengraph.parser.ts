import type { OgData } from '#types';

export function extractOgFromHtml(html: string): OgData {
  const og: OgData = {};
  for (const m of html.matchAll(/<meta[^>]+>/gi)) {
    const tag = m[0];
    const prop = tag.match(/(?:property|name)=["']([^"']+)["']/i)?.[1];
    const content = tag.match(/content=["']([^"']*)["']/i)?.[1];
    if (prop && content !== undefined && (prop.startsWith('og:') || prop.startsWith('twitter:'))) {
      og[prop] = content;
    }
  }
  return og;
}
