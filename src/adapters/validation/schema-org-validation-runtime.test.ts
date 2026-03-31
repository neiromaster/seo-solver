import { expect, test } from 'bun:test';
import { createSchemaOrgValidationRuntime } from './schema-org-validation-runtime';

test('schema.org validation runtime loads validator and returns plain runtime issues', async () => {
  const runtime = createSchemaOrgValidationRuntime({
    fetchImpl: Object.assign(async () => new Response(JSON.stringify({ '@context': 'https://schema.org' })), fetch),
    loadValidatorModule: async () => ({
      default: class {
        debug = false;

        constructor(_schemaOrgJson: unknown) {}

        async validate() {
          return [
            {
              issueMessage: 'Missing field',
              severity: 'ERROR' as const,
              path: [{ type: 'Article', index: 0 }],
              fieldNames: ['headline'],
            },
          ];
        }
      },
    }),
  });

  const issues = await runtime.validateJsonLd({
    Article: [{ '@type': 'Article', headline: 'Hello' }],
  });

  expect(issues).toHaveLength(1);
  expect(issues[0]?.severity).toBe('ERROR');
  expect(issues[0]?.fieldNames).toEqual(['headline']);
});
