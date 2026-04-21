export type ValidationSummary = {
  errors: number;
  warnings: number;
  info: number;
  total: number;
};

export type ComparisonSummary = {
  added: number;
  removed: number;
  changed: number;
  identical: number;
  total: number;
};
