import { expect, test } from 'bun:test';
import type { SchemaOrgValidationRuntime } from '#adapters/validation';
import type { ExtractedDocument } from '#kernel';
import { SchemaOrgValidator } from './schema-org-validator';

test('maps adobe validator issues into V2 validation report', async () => {
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
