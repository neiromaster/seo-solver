declare module '@adobe/structured-data-validator' {
  export class Validator {
    constructor(schemaOrgJson?: unknown);
    validate(waeData: unknown): Promise<unknown[]>;
  }
}
