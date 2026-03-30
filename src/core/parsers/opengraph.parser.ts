import { NoDataFoundError } from '#core/errors';
import type { OgData } from '#types';

function addOgValue(og: OgData, prop: string, content: string): void {
  const current = og[prop];
  if (current === undefined) {
    og[prop] = content;
    return;
  }

  if (Array.isArray(current)) {
    current.push(content);
    return;
  }

  og[prop] = [current, content];
}

export function extractOgFromHtml(html: string, url: string): OgData {
  const og: OgData = {};
  for (const m of html.matchAll(/<meta[^>]+>/gi)) {
    const tag = m[0];
    const prop = tag.match(/(?:property|name)=["']([^"']+)["']/i)?.[1];
    const content = tag.match(/content=["']([^"']*)["']/i)?.[1];
    if (prop && content !== undefined && (prop.startsWith('og:') || prop.startsWith('twitter:'))) {
      addOgValue(og, prop, content);
    }
  }
  if (Object.keys(og).length === 0) {
    throw new NoDataFoundError(url, 'opengraph');
  }
  return og;
}
