declare module '@adobe/structured-data-validator' {
  export type ValidationIssue = {
    issueMessage: string;
    severity: 'ERROR' | 'WARNING';
    path: Array<{ type: string; index: number }> | undefined;
    fieldNames: string[];
    location?: string;
  };

  export default class Validator {
    constructor(schemaOrgJson: unknown);
    debug: boolean;
    validate(data: {
      jsonld: Record<string, unknown[]>;
      microdata: Record<string, unknown[]>;
      rdfa: Record<string, unknown[]>;
    }): Promise<ValidationIssue[]>;
  }
}
