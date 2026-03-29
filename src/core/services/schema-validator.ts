import {
  buildValidationReport,
  groupSchemasByType,
  renderValidationReportLines,
} from '#core/validators/schema-org.report';
import type { Schema } from '#types';

type ValidatorModule = typeof import('@adobe/structured-data-validator');

export type SchemaValidator = {
  validate(schemas: Schema[]): Promise<void>;
};

export type SchemaValidatorDeps = {
  fetchImpl: typeof fetch;
  loadValidatorModule: () => Promise<ValidatorModule>;
  log: Pick<Console, 'log'>;
};

export async function validateSchemasWithDeps(schemas: Schema[], deps: SchemaValidatorDeps): Promise<void> {
  const schemaOrgJson = await (
    await deps.fetchImpl('https://schema.org/version/latest/schemaorg-all-https.jsonld')
  ).json();

  const extractedData = {
    jsonld: groupSchemasByType(schemas),
    microdata: {},
    rdfa: {},
  };

  const validatorModule = await deps.loadValidatorModule();
  const Validator = validatorModule.default;
  const validator = new Validator(schemaOrgJson);
  validator.debug = false;

  const results = await validator.validate(extractedData);
  const report = buildValidationReport(results);

  for (const line of renderValidationReportLines(report)) {
    if (line === '') {
      deps.log.log();
    } else {
      deps.log.log(line);
    }
  }
}

export function createSchemaValidator(deps: SchemaValidatorDeps): SchemaValidator {
  return {
    validate(schemas) {
      return validateSchemasWithDeps(schemas, deps);
    },
  };
}
