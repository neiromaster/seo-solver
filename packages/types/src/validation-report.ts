import type { ValidationResult } from './validation-result.js';

export type ValidationReport = {
  url: string;
  timestamp: string;
  fetch: {
    statusCode: number;
    timing: number;
    redirects: [status: number, url: string][];
  };
  validations: ValidationResult[];
};
