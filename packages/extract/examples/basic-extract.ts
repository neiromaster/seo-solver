import { extractHtml, getTargetData, getTargetStatus, hasTargetData } from '@seo-solver/extract';
import type { ExtractedPage } from '@seo-solver/types/extract';

const page: ExtractedPage = extractHtml(
  '<!doctype html><html><head><title>Hello</title></head><body><h1>Hello</h1></body></html>',
  { targets: ['meta', 'headings'] },
);

console.log({
  url: page.source.url,
  title: getTargetData(page, 'meta')?.title ?? null,
  headings: hasTargetData(page, 'headings') ? getTargetData(page, 'headings') : [],
  opengraphStatus: getTargetStatus(page, 'opengraph') ?? 'not selected',
  warnings: page.errors.map((error) => error.message),
});
