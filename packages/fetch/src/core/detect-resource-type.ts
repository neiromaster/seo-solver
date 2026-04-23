import type { ResourceType } from '@seo-solver/types';

const ROBOTS_PATH_PATTERN = /\/robots\.txt$/i;
const SITEMAP_PATH_PATTERN = /\/sitemap[^/]*\.xml$/i;
const JSON_PATH_PATTERN = /\.json$/i;
const HTML_PATH_PATTERN = /\.html?$/i;

export function detectResourceType(url: string, contentType: string | null): ResourceType {
  const pathname = getPathname(url);
  if (pathname) {
    if (ROBOTS_PATH_PATTERN.test(pathname)) {
      return 'robots-txt';
    }

    if (SITEMAP_PATH_PATTERN.test(pathname)) {
      return 'sitemap-xml';
    }

    if (JSON_PATH_PATTERN.test(pathname)) {
      return 'json';
    }

    if (HTML_PATH_PATTERN.test(pathname)) {
      return 'html';
    }
  }

  const normalizedContentType = contentType?.split(';', 1)[0]?.trim().toLowerCase() ?? null;
  if (!normalizedContentType) {
    return 'binary';
  }

  if (normalizedContentType.includes('sitemap')) {
    return 'sitemap-xml';
  }

  if (normalizedContentType === 'text/html' || normalizedContentType === 'application/xhtml+xml') {
    return 'html';
  }

  if (normalizedContentType === 'application/json' || normalizedContentType === 'application/ld+json') {
    return 'json';
  }

  if (
    normalizedContentType === 'text/plain' ||
    normalizedContentType === 'text/xml' ||
    normalizedContentType === 'application/xml'
  ) {
    return 'text';
  }

  return 'binary';
}

function getPathname(url: string): string | null {
  try {
    return new URL(url).pathname;
  } catch {
    return null;
  }
}
