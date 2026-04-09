export type Severity = 'error' | 'warning' | 'info';

export type Diagnostic = {
  severity: Severity;
  rule: string;
  message: string;
  path?: string;
  expected?: unknown;
  actual?: unknown;
};
