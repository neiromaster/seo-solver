import type { ComparisonResult } from './comparison-result';

export type ComparisonReport = {
  urlA: string;
  urlB: string;
  timestamp: string;
  fetchA: {
    statusCode: number;
    timing: number;
  };
  fetchB: {
    statusCode: number;
    timing: number;
  };
  comparisons: ComparisonResult[];
};
