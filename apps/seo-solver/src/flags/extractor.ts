import { option, optional, string } from 'cmd-ts';

export const extractorsFlag = option({
  long: 'extractors',
  short: 'e',
  type: optional(string),
  description: 'Comma-separated list of extractors: opengraph,jsonld,meta,headings,canonical,robots-txt (default: all)',
});

export function parseExtractors(raw: string | undefined): string[] | undefined {
  if (!raw) {
    return undefined;
  }

  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}
