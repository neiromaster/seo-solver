import { createSchemaValidator } from '#core/services/schema-validator';
import type { Schema } from '#types';

export {
  buildValidationReport,
  groupSchemasByType,
  groupValidationIssues,
  renderValidationReportLines,
  type ValidationReport,
  type ValidationReportSection,
} from './schema-org.report';

type ValidatorModule = typeof import('@adobe/structured-data-validator');

export type ValidateSchemasDeps = {
  fetchImpl: typeof fetch;
  loadValidatorModule: () => Promise<ValidatorModule>;
};

export function loadDefaultValidatorModule(): Promise<ValidatorModule> {
  return import('@adobe/structured-data-validator');
}

const defaultValidateSchemasDeps: ValidateSchemasDeps = {
  fetchImpl: fetch,
  loadValidatorModule: loadDefaultValidatorModule,
};

export async function validateSchemas(
  schemas: Schema[],
  deps: ValidateSchemasDeps = defaultValidateSchemasDeps,
): Promise<void> {
  const schemaValidator = createSchemaValidator({
    fetchImpl: deps.fetchImpl,
    loadValidatorModule: deps.loadValidatorModule,
    log: console,
  });

  await schemaValidator.validate(schemas);
}
