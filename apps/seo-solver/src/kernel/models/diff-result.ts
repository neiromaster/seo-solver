import type { CapabilityId } from './capability-id';

export type DiffChange = {
  kind: 'added' | 'removed' | 'changed';
  path: string;
  left?: string;
  right?: string;
};

export type DiffResult = {
  comparatorId: CapabilityId;
  documentKind: string;
  equal: boolean;
  changes: DiffChange[];
};
