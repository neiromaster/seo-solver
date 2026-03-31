import type { CapabilityId } from './capability-id';

export type ValidationIssue = {
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  path?: string;
};

export type ValidationReport = {
  validatorId: CapabilityId;
  documentKind: string;
  ok: boolean;
  issues: ValidationIssue[];
};
