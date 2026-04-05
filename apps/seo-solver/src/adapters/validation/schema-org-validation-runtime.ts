import type { ValidationIssue as AdobeValidationIssue } from '@adobe/structured-data-validator';

type ValidatorModule = typeof import('@adobe/structured-data-validator');

export type SchemaOrgRuntimeIssue = {
  severity: 'ERROR' | 'WARNING';
  issueMessage: string;
  path: { type: string; index?: number }[] | undefined;
  fieldNames: string[];
};

export type SchemaOrgValidationRuntime = {
  validateJsonLd(groupedJsonLd: Record<string, unknown[]>): Promise<SchemaOrgRuntimeIssue[]>;
};

export type SchemaOrgValidationRuntimeDeps = {
  fetchImpl: typeof fetch;
  loadValidatorModule: () => Promise<ValidatorModule>;
};

export function createSchemaOrgValidationRuntime(
  deps: SchemaOrgValidationRuntimeDeps = {
    fetchImpl: fetch,
    loadValidatorModule: () => import('@adobe/structured-data-validator'),
  },
): SchemaOrgValidationRuntime {
  return {
    async validateJsonLd(groupedJsonLd) {
      const schemaOrgUrl =
        process.env.SEO_SOLVER_SCHEMA_ORG_URL ?? 'https://schema.org/version/latest/schemaorg-all-https.jsonld';
      const schemaOrgJson = await (await deps.fetchImpl(schemaOrgUrl)).json();
      const validatorModule = await deps.loadValidatorModule();
      const ValidatorClass = validatorModule.default;
      const validator = new ValidatorClass(schemaOrgJson);
      validator.debug = false;

      const issues = await validator.validate({
        jsonld: groupedJsonLd,
        microdata: {},
        rdfa: {},
      });

      return issues.map(toRuntimeIssue);
    },
  };
}

function toRuntimeIssue(issue: AdobeValidationIssue): SchemaOrgRuntimeIssue {
  return {
    severity: issue.severity,
    issueMessage: issue.issueMessage,
    path: issue.path,
    fieldNames: issue.fieldNames,
  };
}
