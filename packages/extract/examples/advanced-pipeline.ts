import { listTargets } from '@seo-solver/extract';
import { createExtractorPipeline } from '@seo-solver/extract/advanced';
import type { FetchResult } from '@seo-solver/types/fetch';

const input: FetchResult = {
  requestUrl: 'https://example.com',
  url: 'https://example.com',
  statusCode: 200,
  headers: {},
  body: '<!doctype html><html><head><title>Hello</title></head><body></body></html>',
  resourceType: 'html',
  redirects: [],
  timing: 0,
  attempts: 1,
};

const pipeline = createExtractorPipeline({ targets: listTargets().map((entry) => entry.key) });

console.log(pipeline.extract(input));
