import { extractHeadings, extractHtml, extractMetaTags } from '@seo-solver/extract';

const html =
  '<!doctype html><html><head><title>Hello</title><meta name="description" content="Intro"></head><body><h1>Hello</h1></body></html>';
const page = extractHtml(html, { targets: ['meta', 'headings'] });

console.log({
  url: page.source.url,
  meta: extractMetaTags(html),
  headings: extractHeadings(html),
});
