import type { ExtractedPage, TargetKey } from '@seo-solver/types/extract';
import type { ExtractionEnvelope } from '@seo-solver/types/extract-advanced';
import type { FetchResult } from '@seo-solver/types/fetch';

export function toExtractedPage(fetch: FetchResult, envelopes: ExtractionEnvelope[]): ExtractedPage {
  return {
    source: {
      requestUrl: fetch.requestUrl,
      url: fetch.url,
      statusCode: fetch.statusCode,
      resourceType: fetch.resourceType,
      redirects: fetch.redirects,
      timing: fetch.timing,
      attempts: fetch.attempts,
      fetchedAt: new Date().toISOString(),
    },
    data: {
      canonical: findData(envelopes, 'canonical'),
      headings: findData(envelopes, 'headings'),
      jsonld: findData(envelopes, 'jsonld'),
      meta: findData(envelopes, 'meta'),
      opengraph: findData(envelopes, 'opengraph'),
      robotsTxt: findData(envelopes, 'robots-txt'),
    },
    errors: envelopes.flatMap((envelope) =>
      (envelope.warnings ?? []).map((warning) => ({
        extractor: normalizeTargetKey(envelope.type),
        message: warning.message,
        path: warning.location,
      })),
    ),
  };
}

function findData<T>(envelopes: ExtractionEnvelope[], type: string): T | null {
  const envelope = envelopes.find((entry) => entry.type === type);
  return (envelope?.data as T | undefined) ?? null;
}

function normalizeTargetKey(type: string): TargetKey {
  return (type === 'robots-txt' ? 'robotsTxt' : type) as TargetKey;
}
