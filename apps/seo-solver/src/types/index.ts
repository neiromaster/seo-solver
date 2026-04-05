export type Schema = Record<string, unknown>;

export type ValidationIssue = {
  issueMessage: string;
  severity: 'ERROR' | 'WARNING';
  path: Array<{ type: string; index: number }> | undefined;
  fieldNames: string[];
  location?: string;
};

export type OgData = Record<string, string | string[]>;

export type FlatData = Record<string, string | string[]>;
