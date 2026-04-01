import { expect, test } from 'bun:test';
import type { SchemaOrgValidationRuntime } from '#adapters/validation';
import type { ExtractedDocument } from '#kernel';
import { SchemaOrgValidator } from './schema-org-validator';

test('maps adobe validator issues into validation report', async () => {
  const runtime: SchemaOrgValidationRuntime = {
    validateJsonLd: async () => [
      {
        issueMessage: 'Missing field',
        severity: 'ERROR',
        path: [{ type: 'Article', index: 0 }],
        fieldNames: ['headline'],
      },
    ],
  };

  const validator = new SchemaOrgValidator(runtime);

  const report = await validator.validate({
    extractorId: 'jsonld',
    kind: 'jsonld',
    source: { url: 'https://example.com', fetcherId: 'basic' },
    data: [{ '@type': 'Article', headline: 'Hello' }],
  } satisfies ExtractedDocument);

  expect(report.ok).toBe(false);
  expect(report.issues[0]?.severity).toBe('error');
  expect(report.issues[0]?.code).toBe('headline');
});

test('omits non-finite nested indexes in mapped issue paths', async () => {
  const runtime: SchemaOrgValidationRuntime = {
    validateJsonLd: async () => [
      {
        issueMessage: 'Missing field',
        severity: 'WARNING',
        path: [{ type: 'Event', index: 0 }, { type: 'AggregateOffer' }],
        fieldNames: ['highPrice'],
      },
    ],
  };

  const validator = new SchemaOrgValidator(runtime);

  const report = await validator.validate({
    extractorId: 'jsonld',
    kind: 'jsonld',
    source: { url: 'https://example.com', fetcherId: 'basic' },
    data: [{ '@type': 'Event', offers: { '@type': 'AggregateOffer' } }],
  } satisfies ExtractedDocument);

  expect(report.issues[0]?.path).toBe('Event[1].AggregateOffer');
});
