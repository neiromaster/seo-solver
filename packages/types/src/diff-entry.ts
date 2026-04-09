export type DiffKind = 'added' | 'removed' | 'changed';

export type DiffEntry = {
  kind: DiffKind;
  path: string;
  before?: unknown;
  after?: unknown;
};
