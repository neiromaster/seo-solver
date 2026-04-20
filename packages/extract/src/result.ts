import type { ExtractedPage, ExtractedPageData, ExtractedTargetStatus, TargetKey } from '@seo-solver/types/extract';
import type { ExtractionEnvelope } from '@seo-solver/types/extract-advanced';
import type { FetchResult } from '@seo-solver/types/fetch';

export function toExtractedPage(
  fetch: FetchResult,
  envelopes: ExtractionEnvelope[],
  targets: readonly TargetKey[],
): ExtractedPage {
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
    data: toExtractedPageData(envelopes, targets),
    targetStatus: toExtractedTargetStatus(envelopes, targets),
    errors: envelopes.flatMap((envelope) =>
      (envelope.warnings ?? []).map((warning) => ({
        extractor: normalizeTargetKey(envelope.type),
        message: warning.message,
        path: warning.location,
      })),
    ),
  };
}

function toExtractedPageData(envelopes: ExtractionEnvelope[], targets: readonly TargetKey[]): ExtractedPageData {
  const data: ExtractedPageData = {};

  for (const target of targets) {
    data[target] = findData(envelopes, toEnvelopeType(target));
  }

  return data;
}

function toExtractedTargetStatus(
  envelopes: ExtractionEnvelope[],
  targets: readonly TargetKey[],
): ExtractedTargetStatus {
  const status: ExtractedTargetStatus = {};

  for (const target of targets) {
    status[target] = hasEnvelopeWithData(envelopes, toEnvelopeType(target)) ? 'present' : 'missing';
  }

  return status;
}

function findData<T>(envelopes: ExtractionEnvelope[], type: string): T | null {
  const envelope = envelopes.find((entry) => entry.type === type);
  return (envelope?.data as T | undefined) ?? null;
}

function hasEnvelopeWithData(envelopes: ExtractionEnvelope[], type: string): boolean {
  return envelopes.some((entry) => entry.type === type && entry.data !== null && entry.data !== undefined);
}

function normalizeTargetKey(type: string): TargetKey {
  return (type === 'robots-txt' ? 'robotsTxt' : type) as TargetKey;
}

function toEnvelopeType(target: TargetKey): string {
  return target === 'robotsTxt' ? 'robots-txt' : target;
}
